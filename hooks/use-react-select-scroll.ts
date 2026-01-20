import { useEffect } from "react"

// Ensures react-select menus open scrolled to the currently selected option.
// Covers portal menus and custom class prefixes by querying broad selectors and
// running multiple passes as the menu renders.
export function useReactSelectScrollToSelected() {
  useEffect(() => {
    if (typeof document === "undefined") return

    const selectors = [
      ".react-select__menu-list",
      '[class*="react-select__menu-list"]',
      '[class*="menu-list"]',
    ]

    const optionSelectors = [
      '.react-select__option--is-selected',
      '.react-select__option[aria-selected="true"]',
      '[class*="option--is-selected"]',
      '[aria-selected="true"]',
    ]

    const scrollOnce = () => {
      const menuLists = selectors
        .map((sel) => Array.from(document.querySelectorAll<HTMLElement>(sel)))
        .flat()

      menuLists.forEach((menuList) => {
        const selectedOption = optionSelectors
          .map((sel) => menuList.querySelector<HTMLElement>(sel))
          .find((el) => !!el)

        if (!selectedOption) return

        const targetScrollTop = selectedOption.offsetTop
        const needsScroll = Math.abs(menuList.scrollTop - targetScrollTop) > 2

        if (needsScroll) {
          menuList.scrollTop = targetScrollTop
        }
      })
    }

    const runScrollSequence = () => {
      // Multiple passes to catch late renders / portals
      requestAnimationFrame(scrollOnce)
      setTimeout(scrollOnce, 30)
      setTimeout(scrollOnce, 80)
      setTimeout(scrollOnce, 150)
    }

    const observer = new MutationObserver((mutations) => {
      const menuAdded = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof HTMLElement)) return false
          return (
            node.classList.contains("react-select__menu") ||
            !!node.querySelector(".react-select__menu-list") ||
            !!node.querySelector('[class*="menu-list"]')
          )
        })
      )

      if (menuAdded) {
        runScrollSequence()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Also hook into menu opens via control clicks/focus (defensive)
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.react-select__control') || target.closest('[class*="react-select__control"]')) {
        setTimeout(runScrollSequence, 10)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)

    return () => {
      observer.disconnect()
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [])
}
