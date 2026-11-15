import { HISTORY_KEY, HISTORY_LIMIT } from '@/constants';
import type { Country } from '@/core/mapCountryResponse';
import { createSearchHistory } from '@/core/searchHistory';
import { createDomElement } from '@/helpers/createDomElement';
import { getViewStatus } from '@/helpers/getViewStatus';
import { createCountrySearch } from '@/store/store';
import { createCountryCard } from '@/ui/components/CountryCard';
import { createCountryDetails } from '@/ui/components/CountryDetails';
import { createFooter } from '@/ui/components/Footer';
import { createHeader } from '@/ui/components/Header';
import { createMessage } from '@/ui/components/Message';
import { createSearchHistoryPanel } from '@/ui/components/SearchHistory';
import { createSearchInput } from '@/ui/components/SearchInput';
import { createSpinner } from '@/ui/components/Spinner';

export function startApp() {
  document.body.classList.add('layout');
  const store = createCountrySearch();
  const history = createSearchHistory(window.localStorage, HISTORY_KEY, HISTORY_LIMIT);
  const header = createHeader();
  const footer = createFooter();
  const main = createDomElement({
    tag: 'main',
    classNames: ['main'],
  });
  const input = createSearchInput({ onChange: store.fetchCountries });
  const historyContainer = createDomElement({ classNames: ['history'] });
  const messageContainer = createDomElement({
    classNames: ['message'],
  });
  const cardsContainer = createDomElement({
    classNames: ['cards'],
  });

  main.append(input, historyContainer, messageContainer, cardsContainer);
  document.body.append(header, main, footer);

  const search = (query: string) => {
    input.value = query;
    store.fetchCountries(query);
  };

  const renderHistory = () => {
    historyContainer.replaceChildren();

    const items = history.getAll();

    if (items.length === 0) {
      return;
    }

    createSearchHistoryPanel({
      items,
      onSelect: (query) => {
        history.add(query);
        renderHistory();
        search(query);
      },
      onClear: () => {
        history.clear();
        renderHistory();
      },
      parentElement: historyContainer,
    });
  };

  const saveQuery = (query: string) => {
    const before = history.getAll().join('\u0000');
    const after = history.add(query).join('\u0000');

    if (after !== before) {
      renderHistory();
    }
  };

  const openCountryDetails = (country: Country) => {
    const modal = createCountryDetails({
      country,
      onClose: () => {
        modal.remove();
      },
    });

    document.body.append(modal);
  };

  const render = () => {
    const state = store.getState();
    const viewStatus = getViewStatus(state, input.value);

    messageContainer.replaceChildren();
    cardsContainer.replaceChildren();

    switch (viewStatus) {
      case 'error':
        createMessage({
          variant: 'error',
          title: 'Something went wrong',
          description: state.error?.message ?? '',
          action: {
            label: 'Retry',
            onClick: () => store.fetchCountries(input.value),
          },
          parentElement: messageContainer,
        });

        return;

      case 'loading':
        createSpinner({ label: 'Searching...', parentElement: messageContainer });

        return;

      case 'empty':
        createMessage({
          variant: 'info',
          title: 'Nothing found',
          description: 'Try a different country name.',
          parentElement: messageContainer,
        });

        return;

      case 'idle':
        createMessage({
          variant: 'info',
          title: 'Start typing a country name',
          parentElement: messageContainer,
        });

        return;

      case 'results':
        saveQuery(input.value);

        state.countries.forEach((country) => {
          createCountryCard({
            country,
            parentElement: cardsContainer,
            onClick: (c) => openCountryDetails(c),
          });
        });

        return;
    }
  };

  renderHistory();
  render();
  store.subscribe(render);
}
