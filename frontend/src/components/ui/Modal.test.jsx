import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders when open with title and children', () => {
    render(
      <Modal title="Test Modal" onClose={() => {}}>
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('renders title correctly', () => {
    render(
      <Modal title="My Custom Title" onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Close Test" onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    // Click the outer overlay div (first child)
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="No Close" onClose={onClose}>
        <p>Click me</p>
      </Modal>
    );
    fireEvent.click(screen.getByText('Click me'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
