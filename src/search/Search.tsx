import React, { FC, useState, useEffect, useCallback, Dispatch, SetStateAction, useRef } from 'react';
import useKey from './useKey';
import spinner from '../assets/spinner.gif';
import './search.css';

type optionType = {
  name: string;
  id: string;
  url: string;
  type: string;
};

type listOptionType = {
  option: optionType;
  active: boolean;
  setSelected: (option: optionType) => void;
  setHovered: Dispatch<SetStateAction<optionType | undefined>>;
};

const initialOptionsState: optionType[] = [];

const Search: FC = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState(initialOptionsState);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<optionType | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const downKey = useKey('ArrowDown', inputRef);
  const upKey = useKey('ArrowUp', inputRef);

  const openLink = (option: optionType = options[cursor]) => {
    if (option?.url) window.open(option?.url, '_blank');
  };

  useKey('Enter', inputRef, openLink);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function formatResult(item: any): optionType {
    return { name: item.name || item.login, id: item.id, url: item.html_url, type: item.type };
  }

  const fetchResults = useCallback(async (context: string, query: string): Promise<optionType[]> => {
    return await fetch(`https://api.github.com/search/${context}?q=${query}&per_page=50&page=1`)
      .then((response) => {
        if (!response.ok) throw new Error('Error');
        else {
          return response.json();
        }
      })
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

  const handleUpdate = async (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      setLoading(true);
    } else if (options.length) {
      setOptions([]);
      setError(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    function searchForQuery() {
      const contexts = ['repositories', 'users'];
      const promises = contexts.map((context) => fetchResults(context, query));
      Promise.all(promises).then((response) => {
        const results = response.flat();
        setLoading(false);
        if (results.length) {
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
      });
    }
    if (loading) {
      const time = setTimeout(() => {
        if (query === inputRef.current?.value) {
          searchForQuery();
        }
      }, 500);
      return () => clearTimeout(time);
    }
  }, [query, fetchResults, loading]);

  useEffect(() => {
    if (options.length && downKey) {
      setCursor((prevState) => (prevState < options.length - 1 ? prevState + 1 : prevState));
    }
  }, [downKey, options.length]);
  useEffect(() => {
    if (options.length && upKey) {
      setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [upKey, options.length]);
  useEffect(() => {
    if (options.length && hovered) {
      setCursor(options.indexOf(hovered));
    }
  }, [hovered, options.length, options]);

  const ListOption = ({ option, active, setSelected, setHovered }: listOptionType) => (
    <div
      className={`result ${active ? 'active' : ''}`}
      key={option.id}
      onClick={() => setSelected(option)}
      onMouseEnter={() => setHovered(option)}
    >
      {option.name}
      <span className="result__type">{option.type || 'Repository'}</span>
    </div>
  );

  return (
    <div className="wrapper">
      <input
        data-testid="search-input"
        placeholder="Search for rusers and repositories"
        className="input"
        ref={inputRef}
        value={query}
        onChange={(event) => handleUpdate(event.target.value)}
      />
      {loading && <img className="spinner" src={spinner} alt="loading" />}
      <div className="results">
        {options.length && !error
          ? options.map((option: optionType, i: number) => {
              if (option?.id) {
                return (
                  <ListOption
                    key={option.id}
                    option={option}
                    active={i === cursor}
                    setSelected={openLink}
                    setHovered={setHovered}
                  />
                );
              } else {
                return null;
              }
            })
          : null}
      </div>
      {error && <div className="error">Error occured</div>}
    </div>
  );
};

export default Search;
