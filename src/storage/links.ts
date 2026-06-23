import type { SavedLink } from "../types/link"

const STORAGE_KEY = "readLaterRegretLinks"

type StorageShape = {
  [STORAGE_KEY]?: SavedLink[]
}

async function setLinks(links: SavedLink[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: links })
}

export async function getLinks(): Promise<SavedLink[]> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as StorageShape

  return result[STORAGE_KEY] ?? []
}

export async function saveLink(link: SavedLink): Promise<SavedLink> {
  const links = await getLinks()
  const existingIndex = links.findIndex((item) => item.url === link.url)

  if (existingIndex >= 0) {
    const existing = links[existingIndex]
    const updated = {
      ...existing,
      ...link,
      id: existing.id,
      createdAt: existing.createdAt
    }

    links[existingIndex] = updated
    await setLinks(links)
    return updated
  }

  await setLinks([link, ...links])
  return link
}

export async function updateLink(id: string, patch: Partial<SavedLink>): Promise<SavedLink | null> {
  const links = await getLinks()
  const index = links.findIndex((link) => link.id === id)

  if (index === -1) {
    return null
  }

  const updated = {
    ...links[index],
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString()
  }

  links[index] = updated
  await setLinks(links)
  return updated
}

export async function deleteLink(id: string): Promise<void> {
  const links = await getLinks()
  await setLinks(links.filter((link) => link.id !== id))
}

export async function clearDiscarded(): Promise<void> {
  const links = await getLinks()
  await setLinks(links.filter((link) => link.status !== "discarded"))
}

