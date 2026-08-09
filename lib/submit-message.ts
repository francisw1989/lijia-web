type SubmitResult =
  | { ok: true }
  | { ok: false; message: string };

async function postMessage(
  path: '/api/messages/contact' | '/api/messages/project' | '/api/messages/tools',
  body: Record<string, string>,
): Promise<SubmitResult> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return { ok: false, message: data.message || 'Submission failed. Please try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

export function submitContactMessage(body: Record<string, string>) {
  return postMessage('/api/messages/contact', body);
}

export function submitProjectMessage(body: Record<string, string>) {
  return postMessage('/api/messages/project', body);
}

export function submitToolsMessage(body: Record<string, string>) {
  return postMessage('/api/messages/tools', body);
}
