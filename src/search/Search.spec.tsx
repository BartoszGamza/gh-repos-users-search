import 'core-js';
import React from 'react';
import { render, RenderResult, fireEvent, act } from '@testing-library/react';
import Search from './Search';

describe('Search', () => {
  let utils: RenderResult;
  jest.useFakeTimers();
  beforeEach(() => {
    utils = render(<Search />);
  });
  const fetchJsonMock = Promise.resolve({ items: [{ id: '123', name: 'some', html_url: 'wp.pl', type: 'type' }] });
  const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
    (): Promise =>
      Promise.resolve({
        ok: true,
        json: () => fetchJsonMock,
      }),
  );
  async function providingInput(value: string) {
    const searchInput = await utils.findByTestId('search-input');
    fireEvent.change(searchInput, { target: { value } });
  }
  it('redners input correctly', async () => {
    expect(await utils.findByTestId('search-input')).toBeInTheDocument();
  });
  describe('inserting value shoter than 3 charcaters', () => {
    beforeEach(async () => {
      await providingInput('12');
    });
    it('does not trigger fetch', () => {
      expect(fetchMock).not.toBeCalled();
    });
  });
  describe('inserting data longer than 2 characters', () => {
    beforeEach(async () => {
      await act(() => providingInput('123'));
      jest.runOnlyPendingTimers();
    });
    it('triggers fetch', () => {
      expect(fetchMock).toBeCalled();
    });
  });
});
