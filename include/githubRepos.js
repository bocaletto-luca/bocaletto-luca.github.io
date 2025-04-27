async function fetchAllRepos() {
  let page = 1;
  let allRepos = [];
  while (true) {
    console.log("Fetching page", page);
    const response = await fetch(`https://api.github.com/users/bocaletto-luca/repos?per_page=100&page=${page}`);
    if (response.status !== 200) {
      console.error("Error fetching repositories, status:", response.status);
      break;
    }
    const repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      console.log("End of fetch, page", page, "empty");
      break;
    }
    allRepos = allRepos.concat(repos);
    page++;
  }
  console.log("Total repositories fetched:", allRepos.length);
  return allRepos;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("repo-loader");
  const languageTabs = document.getElementById("languageTabs");
  const languageTabsContent = document.getElementById("languageTabsContent");
  const totalElem = document.getElementById("repo-total");
  const PAGE_SIZE = 6;

  try {
    const repos = await fetchAllRepos();
    if (loader) loader.remove();

    if (!repos || repos.length === 0) {
      totalElem.innerText = "No repositories found or API rate limit exceeded.";
      return;
    }
    totalElem.innerText = "Total repositories: " + repos.length;

    // Group repositories by language (use "Other" if null)
    const groups = {};
    repos.forEach(repo => {
      const lang = repo.language ? repo.language : "Other";
      if (!groups[lang]) groups[lang] = [];
      groups[lang].push(repo);
    });

    // Sort languages descending by repository count
    const sortedLanguages = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    console.log("Languages sorted by repository count:", sortedLanguages);

    sortedLanguages.forEach(language => {
      const reposGroup = groups[language];
      const totalCount = reposGroup.length;
      const safeLang = language.replace(/\s+/g, '-');
      const tabId = 'tab-' + safeLang;

      // Create tab button
      const navItem = document.createElement("li");
      navItem.className = "nav-item";
      navItem.role = "presentation";
      const tabButton = document.createElement("button");
      tabButton.className = "nav-link";
      tabButton.id = tabId + "-tab";
      tabButton.setAttribute("data-bs-toggle", "tab");
      tabButton.setAttribute("data-bs-target", "#" + tabId);
      tabButton.type = "button";
      tabButton.role = "tab";
      tabButton.setAttribute("aria-controls", tabId);
      tabButton.setAttribute("aria-selected", "false");
      tabButton.innerText = `${language} (${totalCount})`;
      navItem.appendChild(tabButton);
      languageTabs.appendChild(navItem);

      // Create tab content container
      const tabPane = document.createElement("div");
      tabPane.className = "tab-pane fade";
      tabPane.id = tabId;
      tabPane.role = "tabpanel";
      tabPane.setAttribute("aria-labelledby", tabId + "-tab");
      tabPane.innerHTML = `
        <div class="row" id="group-${safeLang}-row"></div>
        <div class="pagination-controls" id="group-${safeLang}-pagination"></div>
      `;
      languageTabsContent.appendChild(tabPane);

      let currentPage = 1;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);
      const rowContainer = tabPane.querySelector("div.row");
      const paginationContainer = tabPane.querySelector(".pagination-controls");

      function renderPage(page) {
        rowContainer.innerHTML = "";
        const start = (page - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, totalCount);
        for (let i = start; i < end; i++) {
          const repo = reposGroup[i];
          const title = repo.name;
          const description = (repo.description && repo.description.trim().length > 0)
                              ? repo.description
                              : "No description provided.";
          const url = repo.html_url;
          const languageTag = repo.language ? repo.language : "Unknown";

          const col = document.createElement("div");
          col.className = "col-md-4 repo-card";
          col.innerHTML = `
            <div class="card bg-secondary text-light mb-3">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title" title="${title}">${title}</h5>
                <p class="card-text flex-grow-1">${description}</p>
                <div class="card-footer d-flex justify-content-between align-items-center">
                  <small>Language: ${languageTag}</small>
                  <a href="${url}" class="btn btn-primary btn-sm" target="_blank">View on GitHub</a>
                </div>
              </div>
            </div>
          `;
          rowContainer.appendChild(col);
        }
        updatePaginationControls(page);
      }

      function updatePaginationControls(page) {
        paginationContainer.innerHTML = "";
        if (totalPages > 1) {
          const prevBtn = document.createElement("button");
          prevBtn.className = "btn btn-sm btn-secondary me-2";
          prevBtn.innerText = "Previous";
          prevBtn.disabled = (page === 1);
          prevBtn.onclick = () => { currentPage--; renderPage(currentPage); };
          paginationContainer.appendChild(prevBtn);

          const pageInfo = document.createElement("span");
          pageInfo.innerText = `Page ${page} of ${totalPages}`;
          paginationContainer.appendChild(pageInfo);

          const nextBtn = document.createElement("button");
          nextBtn.className = "btn btn-sm btn-secondary ms-2";
          nextBtn.innerText = "Next";
          nextBtn.disabled = (page === totalPages);
          nextBtn.onclick = () => { currentPage++; renderPage(currentPage); };
          paginationContainer.appendChild(nextBtn);
        }
      }

      renderPage(currentPage);
    });

    // Automatically activate the first tab
    const firstTabBtn = languageTabs.querySelector("button.nav-link");
    if (firstTabBtn) { firstTabBtn.click(); }
  } catch (error) {
    console.error("Error fetching or processing repositories:", error);
    const loaderFallback = document.getElementById("repo-loader");
    if (loaderFallback) {
      loaderFallback.innerText = "Error loading repositories. Please try again later.";
    }
  }
});
