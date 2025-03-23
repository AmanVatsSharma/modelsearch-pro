import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MakeSelector from './MakeSelector';

describe('MakeSelector', () => {
  const mockMakes = [
    { id: 'make1', name: 'Toyota' },
    { id: 'make2', name: 'Honda' }
  ];
  
  const defaultProps = {
    makes: mockMakes,
    selectedMake: null,
    onChange: vi.fn(),
    loading: false
  };

  it('should render correctly with default props', () => {
    render(<MakeSelector {...defaultProps} />);
    
    expect(screen.getByLabelText('Make')).toBeInTheDocument();
    expect(screen.getByText('Select Make')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<MakeSelector {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should select the correct value', () => {
    render(
      <MakeSelector 
        {...defaultProps} 
        selectedMake={mockMakes[0]} 
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveValue('make1');
  });

  it('should call onChange when selection changes', () => {
    render(<MakeSelector {...defaultProps} />);
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'make2' } });
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('make2');
  });

  it('should show empty state with no makes', () => {
    render(
      <MakeSelector 
        {...defaultProps} 
        makes={[]} 
      />
    );
    
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1); // Just the default "Select Make" option
  });
}); 