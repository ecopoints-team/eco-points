/**
 * Reward Categories API module — endpoints under `/api/web/reward-categories/*`.
 */
import { request } from './client';

/** GET /api/web/reward-categories — list categories (org-scoped). */
export async function getAll() {
    const data = await request('GET', '/reward-categories');
    return data.categories;
}

/** POST /api/web/reward-categories — create a category. */
export async function create(name, organizationId) {
    const data = await request('POST', '/reward-categories', { body: { name, organizationId } });
    return data.category;
}

/** PUT /api/web/reward-categories/:id — rename a category. */
export async function update(id, name) {
    const data = await request('PUT', `/reward-categories/${id}`, { body: { name } });
    return data.category;
}

/** DELETE /api/web/reward-categories/:id — delete (blocked if rewards reference it). */
async function deleteCategory(id) {
    return await request('DELETE', `/reward-categories/${id}`);
}
export { deleteCategory as delete };
