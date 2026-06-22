import { describe, it, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../../src/context/ProgressContext';

function Harness({ work }) {
    const { runWithProgress } = useProgress();
    return <button onClick={() => runWithProgress('Saving...', work)}>go</button>;
}

describe('ProgressProvider', () => {
    it('shows the label while the async work runs, then resolves', async () => {
        let resolveWork;
        const work = () => new Promise((res) => { resolveWork = () => res('ok'); });

        render(
            <ProgressProvider>
                <Harness work={work} />
            </ProgressProvider>
        );

        await act(async () => { screen.getByText('go').click(); });
        expect(screen.getByText('Saving...')).toBeInTheDocument();

        await act(async () => { resolveWork(); });
        await waitFor(() => expect(screen.queryByText('Saving...')).not.toBeInTheDocument());
    });

    it('re-throws on failure so callers can handle errors', async () => {
        let caught = null;
        function FailHarness() {
            const { runWithProgress } = useProgress();
            return (
                <button onClick={async () => {
                    try { await runWithProgress('X', () => Promise.reject(new Error('boom'))); }
                    catch (e) { caught = e; }
                }}>fail</button>
            );
        }
        render(<ProgressProvider><FailHarness /></ProgressProvider>);
        await act(async () => { screen.getByText('fail').click(); });
        await waitFor(() => expect(caught?.message).toBe('boom'));
    });
});
