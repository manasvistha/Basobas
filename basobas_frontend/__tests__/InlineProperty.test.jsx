import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InlineProperty from '@/components/property/InlineProperty';

jest.mock('next/link');
jest.mock('@/lib/api/property', () => ({ getProperty: jest.fn() }));
jest.mock('@/lib/utils/auth-utils', () => ({ getPropertyImageUrl: jest.fn(() => 'http://img.test/p.jpg') }));

import { getProperty } from '@/lib/api/property';

test('InlineProperty shows placeholder when no prop and not loading', () => {
  render(<InlineProperty property={null} />);
  expect(screen.getByText('Property')).toBeInTheDocument();
});

test('InlineProperty renders property data when prop provided', async () => {
  const prop = { _id: 'p1', title: 'My House', location: 'Kathmandu', price: 1000, images: ['p1.jpg'] };
  getProperty.mockResolvedValueOnce(prop);
  render(<InlineProperty property={'p1'} />);
  await waitFor(() => expect(screen.getByText('My House')).toBeInTheDocument());
  expect(screen.getByText('Kathmandu')).toBeInTheDocument();
  expect(screen.getByText(/Rs/)).toBeInTheDocument();
});

test('InlineProperty calls onClick with id when clicked', async () => {
  const prop = { _id: 'p2', title: 'House2', images: [] };
  getProperty.mockResolvedValueOnce(prop);
  const onClick = jest.fn();
  render(<InlineProperty property={'p2'} onClick={onClick} />);
  await waitFor(() => expect(screen.getByText('House2')).toBeInTheDocument());
  fireEvent.click(screen.getByText('House2'));
  expect(onClick).toHaveBeenCalledWith('p2');
});
