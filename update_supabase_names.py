import urllib.request
import json

url = 'https://ermybehjnkxwaijzcpfp.supabase.co/rest/v1/medtask_tasks'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybXliZWhqbmt4d2FpanpjcGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzk1NDcsImV4cCI6MjEwMzYxNTU0N30.T6r6YzDF041qYFmgxBW8LZO7Rr3gjZYRKrvbCgN1CSk',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybXliZWhqbmt4d2FpanpjcGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzk1NDcsImV4cCI6MjEwMzYxNTU0N30.T6r6YzDF041qYFmgxBW8LZO7Rr3gjZYRKrvbCgN1CSk',
}
req = urllib.request.Request(url + '?select=*', headers=headers)
with urllib.request.urlopen(req) as resp:
    tasks = json.loads(resp.read().decode('utf-8'))

for t in tasks:
    assignees = t.get('assignee_ids', [])
    new_assignees = []
    for a in assignees:
        if isinstance(a, dict):
            name = a.get('name', '')
            if 'lagana' in name.lower() or 'guidorizzi' in name.lower() or 'lucca' in name.lower():
                a['name'] = 'Lucca G.'
            elif 'ghiraldini' in name.lower() or 'thiago' in name.lower():
                a['name'] = 'Thiago G.'
            new_assignees.append(a)
        elif isinstance(a, str):
            if a == 'user-1':
                new_assignees.append({'id': 'user-1', 'name': 'Lucca G.', 'avatarUrl': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca', 'type': 'user'})
            elif a == 'user-2':
                new_assignees.append({'id': 'user-2', 'name': 'Thiago G.', 'avatarUrl': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thiago', 'type': 'user'})
            else:
                new_assignees.append(a)

    comments = t.get('comments', [])
    for c in comments:
        if isinstance(c, dict):
            c_name = c.get('authorName', '')
            if 'lagana' in c_name.lower() or 'guidorizzi' in c_name.lower() or 'lucca' in c_name.lower():
                c['authorName'] = 'Lucca G.'
            elif 'ghiraldini' in c_name.lower() or 'thiago' in c_name.lower():
                c['authorName'] = 'Thiago G.'

    patch_headers = {**headers, 'Content-Type': 'application/json'}
    patch_req = urllib.request.Request(
        f"{url}?id=eq.{t['id']}",
        headers=patch_headers,
        data=json.dumps({'assignee_ids': new_assignees, 'comments': comments}).encode('utf-8'),
        method='PATCH'
    )
    urllib.request.urlopen(patch_req)
    print('Updated task in Supabase:', t['id'])

print('All tasks updated in Supabase successfully!')
