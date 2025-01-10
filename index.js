import simpleOctokit from 'simple-octokit'
import * as spawn from 'child_process'
import * as fs from 'node:fs'
(async () => {

  const map = new Map()
  const octokit = simpleOctokit(process.env.GH_TOKEN?.replace(/\W/g, '') ?? '')
  const owner = process.env.GITHUB_REPOSITORY_OWNER?.replace(/\W/g, '') ?? ''
  const outputdir = process.env.README_GENERATOR_OUTPUT_DIR?.replace(/[^0-9a-zA-Z_\/]/g, '') ?? ''
  const markdown = [`
  <div id="to-the-top" align="center">
  <img width="47%" src="stats.svg" />
  &nbsp;
  <img width="50%" src="streak.svg" />
  <img width="57%" src="activity.svg" >
  &nbsp;
  <img width="40%" src="trophies.svg" />
  </div>
  <hr />
  `]

  /** Initialize */
  const init = async () => {
    await updateSvg()
    await updateMap()
    markdown.push(getTOCMarkdown())
    for (const language of sortedMapKeys()) { markdown.push(getH2Markdown(language)) }
    markdown.push(`\n<br /><sup>made with [❤️](https://github.com/slattman/my-favorite-readme-generator) on *${new Date().toLocaleDateString('en-US', {dateStyle: 'full'})} @ ${new Date().toLocaleTimeString('en-US', {timeStyle: 'full'})}*</sup>`)
    await fs.writeFileSync(`.${outputdir}/README.md`, markdown.join('\n\n'))
    console.log("success")
  }

  /** Update the SVG files */
  const updateSvg = async () => {
    [ { name: `.${outputdir}/stats.svg`, url: `https://github-readme-stats.vercel.app/api?username=${owner}&theme=react&show_icons=true&rank_icon=github&count_private=true&hide_border=true&role=OWNER,ORGANIZATION_MEMBER,COLLABORATOR` },
      { name: `.${outputdir}/streak.svg`, url: `https://streak-stats.demolab.com?user=${owner}&theme=react&hide_border=true` },
      { name: `.${outputdir}/activity.svg`, url: `https://github-readme-activity-graph.vercel.app/graph?username=${owner}&theme=react&radius=50&hide_border=true&hide_title=false&area=true&custom_title=Total%20contribution%20graph%20in%20all%20repo` },
      { name: `.${outputdir}/trophies.svg`, url: `https://github-profile-trophy.vercel.app/?username=${owner}&theme=discord&no-frame=true&row=2&column=4` }
    ].map(async (svg) => {
      //if (outputdir.length) return
      await spawn.execSync(`curl -so ${svg.name}.new "${svg.url}"`)
      if (await fs.readFileSync(`${svg.name}.new`).length)
        await spawn.execSync(`mv ${svg.name}.new ${svg.name}`)
      if (await fs.existsSync(`${svg.name}.new`))
        await spawn.execSync(`rm ${svg.name}.new`)
    })
  }

  /** Update the map. */
  const updateMap = async () => {
    for (const repo of await getReposStarredByUser(octokit, owner)) {
      const key = repo.language ?? '📃'
      if (map.has(key)) {
        const obj = map.get(key)
        obj.push(repo)
        map.set(key, obj)
      } else map.set(key, [repo])
    }
  }

  /**
   * Fetches a list of starred repositories by user.
   *
   * @param {simpleOctokit} octokit - The simpleOctokit instance to use.
   * @param {string} username - The GitHub username to fetch starred repositories for.
   * @returns {object[]} A promise resolving to an array of repository names.
   */
  const getReposStarredByUser = async (octokit, username) => {
    let result = []
    for await (const res of octokit.activity.listReposStarredByUser.all({ username })) {
      for (const repo of res.data) { result.push(repo) }
    } //if (outputdir.length) { console.log(result) }
    return result
  }

  /**
   * Returns an array of sorted keys.
   *
   * @returns {string[]} An array of sorted keys.
   */
  const sortedMapKeys = () => {
    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
  }

  /**
   * Returns the converted TOC Markdown string.
   *
   * @returns {string} The converted TOC Markdown string.
   */
  const getTOCMarkdown = () => {
    return Array.from(sortedMapKeys(map)).map((key) => {
      return `[${key}](#--${key.toLowerCase().replace(/ /g, '-')})`
    }).join(' ✨ ')
  }

  /**
   * Gets H2 Markdown string.
   *
   * @param {string} language - The language key.
   * @returns {string} The converted H2 Markdown string.
   */
  const getH2Markdown = (language) => {
    const repos = map.get(language)
    language = language.replace(/ /g, '-')
    return [
      `## [🔝 ✨ ${language}](#to-the-top)\n`, repos.map((repo) => {
        return `\n - [${repo.full_name}](${repo.html_url}) - ${repo.description?.replace(/\n/g, '')} - *[${repo.topics.map((topic) => { return ' [' + topic + '](https://github.com/topics/' + topic + ')' })} ]* - *last updated on ${new Date(repo.updated_at).toLocaleDateString('en-US', {dateStyle: 'medium'})} @ ${new Date(repo.updated_at).toLocaleTimeString('en-US', {timeStyle: 'medium'})}*`
      })].join('').replace(/,\n/g, '\n')
  }
 
init()})()