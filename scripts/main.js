((window) => {
  // render patch list
  const renderPatchList = async (containerSelector, jsonUrl, type = "balance") => {
    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`The type of list should be one of (${SUPPORTED_TYPES.join(", ")}), but "${type}" provided`);
    }

    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container with selector "${containerSelector}" not found.`);
    }

    const patches = await fetchPatches(jsonUrl);
    const patchesByType = patches[type].slice(0);
    patchesByType.sort(desc("date"));
    renderList(container, patchesByType);
  };

  const asyncMemo = (func) => {
    const cache = {};
    return async (...args) => {
      const cacheKey = JSON.stringify(args);
      if (!cache[cacheKey]) {
        cache[cacheKey] = await func(...args);
      }
      return cache[cacheKey];
    };
  };

  const fetchPatches = asyncMemo(async (jsonUrl) => {
    const response = await fetch(jsonUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  });

  const desc = (property, arg2) => (arg2 ? (property > arg2 ? -1 : 1) : (a, b) => (a[property] > b[property] ? -1 : 1));

  const renderList = (container, patches) => {
    const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    // building list
    const fragment = document.createDocumentFragment();
    fragment.append(
      ...patches.map(({ patch = "Unknown Patch", link = "#", date = "Invalid Date" }, i) => {
        const linkElement = document.createElement("a");
        linkElement.textContent = patch;
        linkElement.href = link;

        const dateElement = document.createElement("span");
        dateElement.className = "patch-date";
        const dateObj = new Date(date);
        const formattedDate = isNaN(dateObj) ? date : dateFormatter.format(dateObj);
        dateElement.innerHTML = ` – ${formattedDate}${i === 0 ? " (текущий)" : ""}`;

        const listElement = document.createElement("li");
        listElement.append(linkElement, dateElement);
        return listElement;
      }),
    );
    // rendering list
    container.innerHTML = "";
    container.appendChild(fragment);
  };

  const SUPPORTED_TYPES = ["balance", "game"];

  // theme
  const THEME_KEY = "theme";
  const LIGHT_MODE_CLASS = "light-mode";
  const LIGHT_MODE = "light";
  const DARK_MODE = "dark";

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const isLightMode = htmlElement.classList.toggle(LIGHT_MODE_CLASS);
    const newTheme = isLightMode ? LIGHT_MODE : DARK_MODE;
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (e) {
      console.warn("Unable to access localStorage. Theme will reset on reload.");
    }
    document.dispatchEvent(new CustomEvent("theme-change", { detail: newTheme }));
  };

  const loadTheme = () => {
    const htmlElement = document.documentElement;
    let savedTheme;
    try {
      savedTheme = localStorage.getItem(THEME_KEY) ?? DARK_MODE;
    } catch (e) {
      savedTheme = DARK_MODE;
      console.warn("Unable to access localStorage. Using default theme.");
    }
    if (savedTheme === LIGHT_MODE) {
      htmlElement.classList.add(LIGHT_MODE_CLASS);
    } else {
      htmlElement.classList.remove(LIGHT_MODE_CLASS);
    }
    document.dispatchEvent(new CustomEvent("theme-change", { detail: savedTheme }));
  };

  const handleThemeChange = ({ detail: theme }) => {
    const icons = document.querySelectorAll(".theme-icon");
    if (document.body) {
      document.body.dataset.theme = theme;
    }
    icons.forEach((iconElement) => {
      if (theme === "light") {
        iconElement.classList.remove("fa-sun");
        iconElement.classList.add("fa-moon");
      } else {
        iconElement.classList.remove("fa-moon");
        iconElement.classList.add("fa-sun");
      }
    });
  };

  // scrolling
  const scrollSmooth = (event) => {
    event.preventDefault();
    const targetId = event.currentTarget.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
      });
      history.pushState(null, "", `#${targetId}`);
    }
  };

  const handlePopstateWithSmoothScrolling = (event) => {
    event.preventDefault();
    if (!location.hash) {
      return;
    }
    const targetId = decodeURI(location.hash.substring(1));
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      console.log("popstate", event);
      targetElement.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  // sidebar
  const getScrollBarWidth = () => {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    outer.style.width = "100px";
    outer.style.height = "100px";
    document.body.appendChild(outer);
    const inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    outer.appendChild(inner);
    const scrollBarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode.removeChild(outer);
    return scrollBarWidth;
  };

  const updateSidebar = () => {
    renderNavigation();
    adjustSidebarHeight();
    adjustSidebarWidth(getScrollBarWidth());
  };

  const renderNavigation = () => {
    const navigationPanel = document.querySelector(".navigation");
    if (!navigationPanel) {
      return;
    }
    navigationPanel.classList.add("navigation-sections");

    const createNavigationAnchor = (card) => {
      const id = card.id;
      const titleElement = card.querySelector("h3");
      const title = titleElement?.textContent.trim();
      const img = titleElement?.querySelector("img")?.cloneNode();
      if (!img || !title) {
        return;
      }

      const anchor = document.createElement("a");
      anchor.title = title;
      anchor.href = `#${id}`;

      // Derive tag type from the card header, e.g. buff/nerf/fix/rebalance
      const tagElement = card.querySelector(".flex-title .tag");
      if (tagElement && tagElement.classList) {
        const tagType = [...tagElement.classList].find((cls) => cls !== "tag");
        if (tagType && ["buff", "nerf", "fix", "rebalance"].includes(tagType)) {
          anchor.classList.add(`tag-${tagType}`);
        }
      }

      img.loading = "lazy";
      anchor.append(img);
      anchor.addEventListener("click", scrollSmooth);
      return anchor;
    };

    const createNavigationGroup = (title, cards, targetId, isSection = false) => {
      const elements = [];
      if (title) {
        const titleElement = document.createElement(targetId ? "a" : "h3");
        titleElement.textContent = title;
        titleElement.className = targetId
          ? `navigation-category-button${isSection ? " navigation-section-button" : ""}`
          : "text-center";
        if (targetId) {
          titleElement.href = `#${targetId}`;
          titleElement.addEventListener("click", scrollSmooth);
        }
        elements.push(titleElement);
      }
      elements.push(...cards.map(createNavigationAnchor).filter((x) => x));
      return elements;
    };

    const getUnitLevel = (card) => {
      const title = card.querySelector("h3")?.textContent || "";
      const image = card.querySelector("h3 img")?.getAttribute("src") || "";
      const level = `${title} ${image}`.match(/[TТ]\s*([1-4])/i)?.[1];
      return level === "4" || title.includes("Эксперимент") ? 4 : Number(level || 0);
    };

    const isHoverUnit = (card) => {
      const title = card.querySelector("h3")?.textContent || "";
      const image = card.querySelector("h3 img")?.getAttribute("src") || "";
      return /hover/i.test(image) || /ховер/i.test(title);
    };

    const getFactionOrder = (card) => {
      const title = card.querySelector("h3")?.textContent || "";
      const image = card.querySelector("h3 img")?.getAttribute("src") || "";
      const unit = `${title} ${image}`;

      if (/(ОФЗ|UEF|[\\/]uef[\\/])/i.test(unit)) return 1;
      if (/(Кибран|Cybran|[\\/]cybran[\\/])/i.test(unit)) return 2;
      if (/(Эон|Aeon|[\\/]aeon[\\/])/i.test(unit)) return 3;
      if (/(Серафим|Seraphim|[\\/]sera[\\/])/i.test(unit)) return 4;
      return 5;
    };

    const getUnitRoleOrder = (card) => {
      const title = card.querySelector("h3")?.textContent || "";
      const image = card.querySelector("h3 img")?.getAttribute("src") || "";
      const unit = `${title} ${image}`;

      if (/(развед|скаут|scout|recon|сонар|sonar)/i.test(unit)) {
        return 1;
      }
      if (/(rangebot|снайпер)/i.test(unit)) {
        return 2;
      }
      // Hybrid gunships such as the Aeon Restorer contain "fighter" in their
      // title, but must stay with assault aircraft for faction ordering.
      if (/(штурмовик|gunship)/i.test(unit)) {
        return 3;
      }
      if (/(перехватчик|истребител|interceptor|\basf\b|air.*fighter)/i.test(unit)) {
        return 2;
      }
      if (/(бомбер|бомбард|fighterbomber|fighter-bomber|mercy|милосерд)/i.test(unit)) {
        return 4;
      }
      if (/(танк|бот|подлод|submarine|торпедн.*катер|torpboat|[\\/]sub(?:[^a-z]|$))/i.test(unit)) {
        return 3;
      }
      if (/(артил|arty|mobileml|ракет|missile|фрегат|frigate|frig|эсминец|destroyer)/i.test(unit)) {
        return 4;
      }
      if (/(пво|зенит|флак|mobileaa|antiair|flak|sam|крейсер|cruiser|транспорт|transport)/i.test(unit)) {
        return 5;
      }
      return 6;
    };

    const getSectionRoleOrder = (card, sectionTitle) => {
      const role = getUnitRoleOrder(card);
      if (/Структур/i.test(sectionTitle)) {
        // In structure groups, static anti-air is shown above sonar.
        if (role === 5) return 1;
        if (role === 1) return 5;
      }
      return role;
    };

    const synchronizeCardOrder = (section, groups) => {
      section.querySelectorAll(".content-group-divider").forEach((divider) => divider.remove());
      groups.forEach((group) => {
        const { title, cards, showContentDivider } = group;
        if (!cards.length) {
          return;
        }
        if (showContentDivider && title) {
          const divider = document.createElement("div");
          divider.className = "content-group-divider";
          divider.id = `${cards[0].id}-group`;
          divider.textContent = title;
          divider.setAttribute("role", "heading");
          divider.setAttribute("aria-level", "3");
          section.append(divider);
          group.targetId = divider.id;
        }
        cards.forEach((card) => section.append(card));
      });
      return groups;
    };

    const categorizeSection = (section) => {
      const sectionHeading = section.querySelector("h2");
      const title = sectionHeading?.textContent.trim() || "";
      const cards = [...section.querySelectorAll("article.card")];
      const cardIds = new Set(cards.map((card) => card.id));
      const sectionTargetId = `${cards[0]?.id || "content"}-section`;
      if (sectionHeading) {
        sectionHeading.id = sectionTargetId;
      }

      // Keep all ACU entries together, followed by all SACU entries.
      if (cardIds.has("cybran-acu") && cardIds.has("cybran-sacu")) {
        const acu = cards
          .filter((card) => card.querySelector("h3")?.textContent.includes("БМК"))
          .sort((a, b) => getFactionOrder(a) - getFactionOrder(b));
        const sacu = cards
          .filter((card) => card.querySelector("h3")?.textContent.includes("АКБП"))
          .sort((a, b) => getFactionOrder(a) - getFactionOrder(b));
        const mechanics = cards.filter((card) => !acu.includes(card) && !sacu.includes(card));
        return synchronizeCardOrder(section, [
          { title: "БМК", cards: acu, targetId: acu[0]?.id, isSection: true, showContentDivider: true },
          { title: "АКБП", cards: sacu, targetId: sacu[0]?.id, isSection: true, showContentDivider: true },
          { title: "", cards: mechanics, targetId: mechanics[0]?.id },
        ].filter((group) => group.cards.length));
      }

      // Sort units and structures by tech level. Within a tech level,
      // equivalent types are ordered by faction: UEF, Cybran, Aeon, Seraphim.
      if (/(Наземн|Воздушн|Морск|Флот|Структур)/i.test(title)) {
        const groups = [{ title, cards: [], targetId: sectionTargetId, isSection: true }];
        const categorizedCards = new Set();
        for (const level of [1, 2, 3, 4]) {
          const levelCards = cards
            .filter((card) => getUnitLevel(card) === level)
            .map((card, index) => ({ card, index }))
            .sort((a, b) => {
              const roleDifference = getSectionRoleOrder(a.card, title) - getSectionRoleOrder(b.card, title);
              if (roleDifference) {
                return roleDifference;
              }
              const hoverDifference = Number(isHoverUnit(a.card)) - Number(isHoverUnit(b.card));
              if (hoverDifference) {
                return hoverDifference;
              }
              const factionDifference = getFactionOrder(a.card) - getFactionOrder(b.card);
              return factionDifference || a.index - b.index;
            })
            .map(({ card }) => card);
          if (levelCards.length) {
            groups.push({
              title: level === 4 ? "Экспериментальные" : `Технология Т${level}`,
              cards: levelCards,
              targetId: levelCards[0].id,
              showContentDivider: true,
            });
            levelCards.forEach((card) => categorizedCards.add(card));
          }
        }
        const uncategorizedCards = cards.filter((card) => !categorizedCards.has(card));
        if (uncategorizedCards.length) {
          groups.push({
            title: "Прочие юниты",
            cards: uncategorizedCards,
            targetId: uncategorizedCards[0].id,
            showContentDivider: true,
          });
        }
        return synchronizeCardOrder(section, groups);
      }

      return [{ title, cards, targetId: sectionTargetId, isSection: true }];
    };

    const fragment = document.createDocumentFragment();
    const sections = document.querySelectorAll("div.content section");
    if (sections) {
      const navSections = [...sections];
      const navigationSections = navSections.map((section) => {
        const navigationSection = document.createElement("div");
        navigationSection.className = "navigation-section icon-sidebar-subgrid";
        const navigationGroups = categorizeSection(section);
        navigationSection.append(
          ...navigationGroups
            .map(({ title, cards, targetId, isSection }) =>
              createNavigationGroup(title, cards, targetId, isSection),
            )
            .flat(),
        );
        return navigationSection;
      });
      fragment.append(...navigationSections);
    } else {
      const message = document.createElement("h3");
      message.className = "text-center";
      message.textContent = "Секции не найдены";
      fragment.append(message);
    }

    navigationPanel.append(fragment);
    return navigationPanel;
  };

  const adjustSidebarHeight = () => {
    const sidebarPanelInner = document.querySelector(".icon-sidebar-inner");
    const sidebarPanelInnerHeight = sidebarPanelInner?.clientHeight;
    const sidebarPanelWrapper = document.querySelector(".icon-sidebar-wrapper");
    if (sidebarPanelWrapper) {
      sidebarPanelWrapper.style.height = `${sidebarPanelInnerHeight}px`;
    }
  };

  const organizePresetTables = () => {
    const categoryOrder = [
      { key: "economy", title: "Экономические пресеты" },
      { key: "support", title: "Сапортовские пресеты" },
      { key: "exclusive", title: "Эксклюзивные пресеты" },
      { key: "combat", title: "Боевые пресеты" },
      { key: "special", title: "Особые пресеты" },
    ];
    const presetCategories = {
      "aeon-sacu": {
        Engineer: "economy", RAS: "economy", RASE: "economy",
        Defiler: "support", Aegis: "support", Heretic: "support",
        ShieldCombat: "combat", Rambo: "special",
      },
      "uef-sacu": {
        Engineer: "economy", RAS: "economy", RASE: "economy",
        LastBastion: "support", Mountain: "support",
        Combat: "combat", Rambo: "combat",
      },
      "cybran-sacu": {
        Engineer: "economy", RAS: "economy", RASE: "economy",
        CrossFighter: "support", Veil: "support", Mirage: "support",
        AntiAirGunner: "exclusive",
        Combat: "combat", Rambo: "combat", Cloak: "special",
      },
      "seraphim-sacu": {
        Engineer: "economy", RAS: "economy", RASE: "economy",
        SethToth: "support", SethIyah: "support", SethUhtheIyah: "support",
        Missile: "exclusive",
        NanoCombat: "combat", AdvancedCombat: "special",
      },
    };

    document.querySelectorAll(".preset-table tbody").forEach((body) => {
      const commanderId = body.closest("article.card")?.id;
      const categories = presetCategories[commanderId];
      if (!categories) {
        return;
      }
      body.querySelectorAll(".preset-category-heading").forEach((row) => row.remove());
      const rows = [...body.querySelectorAll(":scope > tr[data-preset]")];
      categoryOrder.forEach(({ key, title }) => {
        const categoryRows = rows.filter((row) => categories[row.dataset.preset] === key);
        if (!categoryRows.length) {
          return;
        }
        const heading = document.createElement("tr");
        heading.className = `preset-category-heading preset-category-${key}`;
        const cell = document.createElement("th");
        cell.colSpan = 2;
        cell.scope = "rowgroup";
        cell.textContent = title;
        heading.append(cell);
        body.append(heading);
        categoryRows.forEach((row, index) => {
          row.classList.remove(...categoryOrder.map((category) => `preset-category-${category.key}`));
          row.classList.toggle("preset-category-last", index === categoryRows.length - 1);
          row.classList.add(`preset-category-${key}`);
          body.append(row);
        });
      });
    });
  };

  const adjustSidebarWidth = (scrollWidth = 17) => {
    const sidebarPanel = document.querySelector(".icon-sidebar");
    if (sidebarPanel) {
      sidebarPanel.style.width = `calc(100% + ${scrollWidth}px)`;
    }
  };

  // resize
  const debounce = (func, ms) => {
    let blocked = false;
    return (...args) => {
      if (!blocked) {
        blocked = true;
        func(...args);
      }
      setTimeout(() => {
        blocked = false;
      }, ms);
    };
  };

  const resize = (elements, ratio) =>
    elements?.forEach((element) => {
      element.height = element.getBoundingClientRect().width * ratio;
    });

  const insertYoutubeVideo = (id, { autoplay = true, mute = true, loop = true, split = false } = {}) => {
    const container = document.createElement("div");
    const iframeElement = document.createElement("iframe");
    iframeElement.src = `https://www.youtube.com/embed/${id}?autoplay=${+autoplay}&mute=${+mute}${loop ? `&loop=${+loop}&playlist=${id}` : ""}`;
    iframeElement.className = "preview";
    iframeElement.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframeElement.referrerPolicy = "strict-origin-when-cross-origin";
    iframeElement.allowFullscreen = true;
    container.append(split ? createSplitWrapper(iframeElement) : iframeElement);
    document.write(container.innerHTML);
  };

  const createSplitWrapper = (iframeElement) => {
    const splitWrapperElement = document.createElement("div");
    splitWrapperElement.className = "preview-split-wrapper";
    splitWrapperElement.append(iframeElement);
    return splitWrapperElement;
  };

  // random background
  const AMOUNT_OF_BACKGROUNDS = 6;
  const setBackground = () => {
    const backgroundId = Math.ceil(Math.random() * AMOUNT_OF_BACKGROUNDS);
    document.body.style.backgroundImage = `url('./assets/images/backgrounds/${backgroundId}.jpg')`;
  };

  // onload
  const handlePageLoad = () => {
    // update year value
    document.querySelectorAll("span.year")?.forEach((yearElement) => {
      yearElement.textContent = new Date().getFullYear();
    });
    // make scrolling smooth
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", scrollSmooth);
    });
    // handle resize and resize preview videos
    const videoPreviews = document.querySelectorAll("iframe.preview");
    if (videoPreviews.length) {
      const handleResize = debounce(() => resize(videoPreviews, 9 / 16), 25);
      window.addEventListener("resize", handleResize);
      setTimeout(handleResize, 50);
    }
    // set default hash for better scrolling (only for balance pages)
    if (location.pathname.includes("/balances/") && !location.hash) {
      location.href = "#top";
      history.replaceState(null, "", location.href);
    }

    loadTheme();
    organizePresetTables();
    if (document.querySelector(".icon-sidebar")) {
      updateSidebar();
    }
  };

  // event handling
  addEventListener("popstate", handlePopstateWithSmoothScrolling);
  document.addEventListener("DOMContentLoaded", handlePageLoad);
  document.addEventListener("theme-change", handleThemeChange);

  // setup global page settings
  history.scrollRestoration = "manual";

  // publishing functions to global object (window)
  window.renderPatchList = renderPatchList;
  window.toggleTheme = toggleTheme;
  window.insertYoutubeVideo = insertYoutubeVideo;
  window.setBackground = setBackground;
})(window);
