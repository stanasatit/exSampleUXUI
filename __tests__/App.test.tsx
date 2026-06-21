/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  jest.useFakeTimers();

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    jest.runOnlyPendingTimers();
  });

  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });

  jest.useRealTimers();
});
