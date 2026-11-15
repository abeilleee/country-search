import { createDomElement } from '@/helpers/createDomElement';
import { createCountrySearch } from '@/store/store';
import { createFooter } from '@/ui/components/Footer';
import { createHeader } from '@/ui/components/Header';
import { createCountryCard } from './components/CountryCard';
import { createSearchInput } from './components/SearchInput/SearchInput';

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
  const cardsContainer = createDomElement({
    classNames: ['cards'],
  });

  main.append(input, cardsContainer);
  document.body.append(header, main, footer);

  const render = () => {
    const { loading, error, countries } = store.getState();
    const isEmpty = !loading && !error && countries.length === 0 && input.value.trim() !== '';

    cardsContainer.replaceChildren();

    countries.map((country) => {
      createCountryCard({ country, parentElement: cardsContainer });
    });

    if (error) {
      return;
    }

    if (loading) {
      return;
    }

    if (isEmpty) {
      return;
    }
  };

  render();
  store.subscribe(render);
}
