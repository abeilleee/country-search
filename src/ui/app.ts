import type { Country } from '@/core/mapCountryResponse';
import { createDomElement } from '@/helpers/createDomElement';
import { getViewStatus } from '@/helpers/getViewStatus';
import { createCountrySearch } from '@/store/store';
import { createCountryCard } from '@/ui/components/CountryCard';
import { createCountryDetails } from '@/ui/components/CountryDetails';
import { createFooter } from '@/ui/components/Footer';
import { createHeader } from '@/ui/components/Header';
import { createMessage } from '@/ui/components/Message';
import { createSearchInput } from '@/ui/components/SearchInput';
import { createSpinner } from '@/ui/components/Spinner';

export function startApp() {
  document.body.classList.add('layout');
  const store = createCountrySearch();
  const header = createHeader();
  const footer = createFooter();
  const main = createDomElement({
    tag: 'main',
    classNames: ['main'],
  });
  const input = createSearchInput({ onChange: store.fetchCountries });
  const messageContainer = createDomElement({
    classNames: ['message'],
  });
  const cardsContainer = createDomElement({
    classNames: ['cards'],
  });

  main.append(input, messageContainer, cardsContainer);
  document.body.append(header, main, footer);

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

  render();
  store.subscribe(render);
}
