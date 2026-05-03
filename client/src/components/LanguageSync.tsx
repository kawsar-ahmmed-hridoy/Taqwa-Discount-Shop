import { useEffect } from 'react';
import { useLocaleStore } from '../store/localeStore';
import { translatePhrase } from '../utils/i18n';

const TEXT_ATTRIBUTES = ['title', 'placeholder', 'aria-label', 'alt'] as const;

const translateSubtree = (root: ParentNode, language: 'en' | 'bn') => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    const parentTag = textNode.parentElement?.tagName;
    if (parentTag && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag)) {
      textNode.nodeValue = translatePhrase(language, textNode.nodeValue ?? '');
    }
    currentNode = walker.nextNode();
  }

  root.querySelectorAll('*').forEach((element) => {
    TEXT_ATTRIBUTES.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) {
        element.setAttribute(attribute, translatePhrase(language, value));
      }
    });
  });
};

const LanguageSync = () => {
  const language = useLocaleStore((state) => state.language);

  useEffect(() => {
    let syncing = false;
    const observer = new MutationObserver(() => {
      if (!syncing) {
        sync();
      }
    });

    const sync = () => {
      if (!document.body) return;

      syncing = true;
      observer.disconnect();

      document.documentElement.lang = language;
      document.title = translatePhrase(language, document.title);
      translateSubtree(document.body, language);

      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...TEXT_ATTRIBUTES],
      });
      syncing = false;
    };

    sync();

    return () => observer.disconnect();
  }, [language]);

  return null;
};

export default LanguageSync;
