/**
 * Unit tests for SkeletonCard component.
 *
 * Validates Requirements:
 *   - 11.1: Skeleton cards match dimensions and layout of actual stat cards
 *   - 11.5: Consistent border radius, spacing, and animation patterns
 *   - 17.1: Dark mode appropriate colors
 *   - 17.2: Light mode appropriate colors
 *   - 17.3: Tailwind dark: prefix for dark mode styling
 *   - 18.1: ARIA label for loading content
 *   - 18.2: aria-busy="true" on containing element
 */
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonCard } from '../../src/components/admin/SkeletonLoaders';

describe('SkeletonCard Component', () => {
    test('renders with default props', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        expect(skeleton).toBeInTheDocument();
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('rounded-2xl');
    });

    test('applies custom className prop', () => {
        const customClass = 'custom-test-class';
        const { container } = render(<SkeletonCard className={customClass} />);
        const skeleton = container.firstChild;

        expect(skeleton).toHaveClass(customClass);
        expect(skeleton).toHaveClass('animate-pulse');
    });

    test('includes required ARIA attributes for accessibility', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
        expect(skeleton).toHaveAttribute('aria-busy', 'true');
        expect(skeleton).toHaveAttribute('role', 'status');
    });

    test('has correct structure matching stat cards', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        // Check for rounded corners
        expect(skeleton).toHaveClass('rounded-2xl');
        
        // Check for padding matching stat cards
        expect(skeleton).toHaveClass('p-6');
        
        // Check for border
        expect(skeleton).toHaveClass('border');
    });

    test('includes dark mode styling with dark: prefix', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        // Check that className includes dark mode classes
        const className = skeleton.className;
        expect(className).toContain('dark:bg-slate-800/50');
        expect(className).toContain('dark:border-slate-700/50');
    });

    test('includes light mode styling', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        // Check light mode background and border
        expect(skeleton).toHaveClass('bg-white');
        expect(skeleton).toHaveClass('border-slate-200');
    });

    test('contains placeholder elements for card content', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        // Check for placeholder divs (icon, title, value, subtext)
        const placeholders = skeleton.querySelectorAll('.bg-slate-200, .bg-slate-100');
        expect(placeholders.length).toBeGreaterThan(0);
    });

    test('has consistent animation with pulse effect', () => {
        const { container } = render(<SkeletonCard />);
        const skeleton = container.firstChild;

        expect(skeleton).toHaveClass('animate-pulse');
    });

    test('renders without crashing with empty className', () => {
        const { container } = render(<SkeletonCard className="" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    test('renders without crashing with undefined className', () => {
        const { container } = render(<SkeletonCard className={undefined} />);
        expect(container.firstChild).toBeInTheDocument();
    });

    test('matches snapshot', () => {
        const { container } = render(<SkeletonCard />);
        expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with custom className', () => {
        const { container } = render(<SkeletonCard className="custom-class" />);
        expect(container.firstChild).toMatchSnapshot();
    });
});
