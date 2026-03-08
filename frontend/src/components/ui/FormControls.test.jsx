import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField, Input, Select, TextArea, Button } from './FormControls';

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Name">
        <input data-testid="child" />
      </FormField>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });
});

describe('Select', () => {
  it('renders options', () => {
    render(
      <Select options={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]} />
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('has default empty option', () => {
    render(<Select options={[]} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });
});

describe('TextArea', () => {
  it('renders a textarea element', () => {
    render(<TextArea placeholder="Notes" />);
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument();
  });
});

describe('Button', () => {
  it('renders with children text', () => {
    render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });
});
