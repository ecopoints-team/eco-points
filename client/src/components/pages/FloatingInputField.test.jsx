import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Mail } from 'lucide-react';
import { FloatingInputField } from './LogIn';

// Feature: login-modal-redesign, Property 1: Filled-state styles applied for any non-empty value
// Validates: Requirements 1.3, 2.4, 3.4
describe('FloatingInputField - Property 1: Filled-state styles applied for any non-empty value', () => {
  it("applies filled-state styles for any non-empty value", () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      (value) => {
        const { container } = render(
          <FloatingInputField
            id="test"
            type="text"
            label="Test"
            icon={<Mail size={18} />}
            value={value}
            onChange={() => {}}
            error={false}
          />
        );
        const label = container.querySelector('label');
        const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
        const separator = container.querySelector('[data-testid="separator"]');
        expect(label.className).toContain('text-xs');
        expect(iconWrapper.className).toContain('text-emerald-400');
        expect(separator.className).toContain('opacity-100');
      }
    ), { numRuns: 100 });
  });
});

describe('FloatingInputField - LeftIcon color states', () => {
  it('shows text-slate-400 when empty and unfocused without error', () => {
    const { container } = render(
      <FloatingInputField
        id="test" type="text" label="Test"
        icon={<Mail size={18} />}
        value="" onChange={() => {}} error={false}
      />
    );
    const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
    expect(iconWrapper.className).toContain('text-slate-400');
    expect(iconWrapper.className).not.toContain('text-emerald-400');
    expect(iconWrapper.className).not.toContain('text-rose-500');
  });

  it('shows text-emerald-400 when value is non-empty and unfocused without error', () => {
    const { container } = render(
      <FloatingInputField
        id="test" type="text" label="Test"
        icon={<Mail size={18} />}
        value="hello" onChange={() => {}} error={false}
      />
    );
    const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
    expect(iconWrapper.className).toContain('text-emerald-400');
    expect(iconWrapper.className).not.toContain('text-rose-500');
  });

  it('shows text-rose-500 when error=true and value is empty', () => {
    const { container } = render(
      <FloatingInputField
        id="test" type="text" label="Test"
        icon={<Mail size={18} />}
        value="" onChange={() => {}} error={true}
      />
    );
    const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
    expect(iconWrapper.className).toContain('text-rose-500');
    expect(iconWrapper.className).not.toContain('text-emerald-400');
  });

  it('shows text-rose-500 when error=true and value is non-empty', () => {
    const { container } = render(
      <FloatingInputField
        id="test" type="text" label="Test"
        icon={<Mail size={18} />}
        value="hello" onChange={() => {}} error={true}
      />
    );
    const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
    expect(iconWrapper.className).toContain('text-rose-500');
    expect(iconWrapper.className).not.toContain('text-emerald-400');
  });
});

// Feature: login-modal-redesign, Property 3: Error clearance restores context-appropriate styles
// Validates: Requirements 5.6
describe('FloatingInputField - Property 3: Error clearance restores context-appropriate styles', () => {
  it("restores context-appropriate styles when error clears", () => {
    fc.assert(fc.property(
      fc.string(),
      (value) => {
        const { rerender, container } = render(
          <FloatingInputField
            id="test"
            type="text"
            label="Test"
            icon={<Mail size={18} />}
            value={value}
            onChange={() => {}}
            error={true}
          />
        );
        rerender(
          <FloatingInputField
            id="test"
            type="text"
            label="Test"
            icon={<Mail size={18} />}
            value={value}
            onChange={() => {}}
            error={false}
          />
        );
        const fieldContainer = container.firstChild;
        const label = container.querySelector('label');
        const iconWrapper = container.querySelector('[data-testid="icon-wrapper"]');
        expect(fieldContainer.className).not.toContain('border-rose-500');
        expect(label.className).not.toContain('text-rose-500');
        expect(iconWrapper.className).not.toContain('text-rose-500');
        if (value.length > 0) {
          expect(iconWrapper.className).toContain('text-emerald-400');
        }
      }
    ), { numRuns: 100 });
  });
});

describe("Separator behavior", () => {
  it("does not render separator when no icon prop", () => {
    const { container } = render(
      <FloatingInputField id="test" type="text" label="Test"
        value="" onChange={() => {}} error={false} />
    );
    expect(container.querySelector('[data-testid="separator"]')).toBeNull();
  });

  it("shows opacity-0 when empty and unfocused", () => {
    const { container } = render(
      <FloatingInputField id="test" type="text" label="Test" icon={<Mail size={18} />}
        value="" onChange={() => {}} error={false} />
    );
    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator.className).toContain('opacity-0');
  });

  it("shows opacity-100 when value is non-empty", () => {
    const { container } = render(
      <FloatingInputField id="test" type="text" label="Test" icon={<Mail size={18} />}
        value="hello" onChange={() => {}} error={false} />
    );
    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator.className).toContain('opacity-100');
  });

  it("shows bg-rose-200 when error=true", () => {
    const { container } = render(
      <FloatingInputField id="test" type="text" label="Test" icon={<Mail size={18} />}
        value="" onChange={() => {}} error={true} />
    );
    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator.className).toContain('bg-rose-200');
  });

  it("shows bg-slate-300 when error=false", () => {
    const { container } = render(
      <FloatingInputField id="test" type="text" label="Test" icon={<Mail size={18} />}
        value="" onChange={() => {}} error={false} />
    );
    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator.className).toContain('bg-slate-300');
  });
});
