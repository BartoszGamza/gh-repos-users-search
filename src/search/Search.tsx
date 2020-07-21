import React, { FC, useState, useEffect, useCallback, RefObject, createRef, Dispatch, SetStateAction } from 'react';
import './search.css';

type optionType = {
  name: string;
  id: string;
  url: string;
};

type listOptionType = {
  option: optionType;
  active: boolean;
  setSelected: (option: optionType) => void;
  setHovered: Dispatch<SetStateAction<optionType | undefined>>;
};

const useKey = function (tagret: string, ref: RefObject<HTMLInputElement>) {
  const [keyPressed, setKeyPressed] = useState(false);

  function downHandler({ key }: { key: string }) {
    if (key === tagret) {
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }: { key: string }) => {
    if (key === tagret) {
      setKeyPressed(false);
    }
  };

  useEffect(() => {
    ref.current?.addEventListener('keydown', downHandler);
    ref.current?.addEventListener('keyup', upHandler);

    return () => {
      ref.current?.removeEventListener('keydown', downHandler);
      ref.current?.removeEventListener('keyup', upHandler);
    };
  });

  return keyPressed;
};

const initialOptionsState: optionType[] = [];

const Search: FC = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState(initialOptionsState);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<optionType | undefined>(undefined);

  const inputRef = createRef<HTMLInputElement>();
  const downKey = useKey('ArrowDown', inputRef);
  const upKey = useKey('ArrowUp', inputRef);
  const enterKey = useKey('Enter', inputRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function formatResult(item: any): optionType {
    return { name: item.name || item.login, id: item.id, url: item.html_url };
  }

  const fetchResults = useCallback(async (context: string, query: string): Promise<optionType[]> => {
    return await fetch(`https://api.github.com/search/${context}?q=${query}&per_page=50&page=1`)
      .then((response) => response.json())
      .then((result) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = result?.items?.map((item: any) => formatResult(item));
        return formatted;
      })
      .catch(() => {
        setError(true);
        return [];
      });
  }, []);

  useEffect(() => {
    async function searchForQuery() {
      const contexts = ['repositories', 'users'];
      const promises = contexts.map((context) => fetchResults(context, query));
      const results = (await Promise.all(promises)).flat();
      results.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        if (aName > bName) {
          return 1;
        }
        if (aName < bName) {
          return -1;
        }
        return 0;
      });
      setOptions(results);
    }
    if (query.length >= 3) {
      const time = setTimeout(() => {
        searchForQuery();
      }, 500);
      return () => clearTimeout(time);
    } else if (options.length) {
      setOptions([]);
      setError(false);
    }
  }, [query, setOptions, fetchResults]);

  useEffect(() => {
    if (options.length && downKey) {
      setCursor((prevState) => (prevState < options.length - 1 ? prevState + 1 : prevState));
    }
  }, [downKey]);
  useEffect(() => {
    if (options.length && upKey) {
      setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [upKey]);
  useEffect(() => {
    if ((options.length && enterKey) || (options.length && hovered)) {
      openLink(options[cursor]);
    }
  }, [enterKey]);
  useEffect(() => {
    if (options.length && hovered) {
      setCursor(options.indexOf(hovered));
    }
  }, [hovered]);

  const openLink = (option: optionType) => {
    const card = window.open(option?.url, '_blank');
    card?.focus();
  };

  const ListOption = ({ option, active, setSelected, setHovered }: listOptionType) => (
    <div
      className={`result ${active ? 'active' : ''}`}
      key={option.id}
      onClick={() => setSelected(option)}
      onMouseEnter={() => setHovered(option)}
    >
      {option.name}
    </div>
  );

  return (
    <div className="wrapper">
      <input className="input" ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="results">
        {options.length && !error ? (
          options.map((option: optionType, i: number) => (
            <ListOption
              key={option.id}
              option={option}
              active={i === cursor}
              setSelected={openLink}
              setHovered={setHovered}
            />
          ))
        ) : error ? (
          <p>Error occured</p>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default Search;
