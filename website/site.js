// Live GitHub numbers in the nav + open-source strip. Fails silently — the site
// works fine without them (unauthenticated API: 60 req/h per IP, cached below).
(async () => {
  const set = (id, v) => document.querySelectorAll('[data-gh="' + id + '"]').forEach(el => { el.textContent = v })
  try {
    let d = null
    const cached = sessionStorage.getItem('gh_repo_fa')
    if (cached) d = JSON.parse(cached)
    else {
      const r = await fetch('https://api.github.com/repos/Igen3ral/Gym')
      if (!r.ok) return
      d = await r.json()
      sessionStorage.setItem('gh_repo_fa', JSON.stringify({ stargazers_count: d.stargazers_count, forks_count: d.forks_count, open_issues_count: d.open_issues_count }))
    }
    set('stars', '★ ' + Number(d.stargazers_count).toLocaleString('fa-IR'))
    set('stars-n', Number(d.stargazers_count).toLocaleString('fa-IR'))
    set('forks-n', Number(d.forks_count).toLocaleString('fa-IR'))
    set('issues-n', Number(d.open_issues_count).toLocaleString('fa-IR'))
  } catch (e) { /* offline / rate-limited — leave placeholders */ }
})()
