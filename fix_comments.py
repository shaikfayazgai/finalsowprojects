import os

old_comment = "from `@/mocks/data/contributor-workspace`. The hook returns the store's"
new_comment = "from the contributor tasks store. The hook returns the store's"

for app in ["enterprise", "freelancer", "mentor", "reviewer", "super-admin"]:
    path = f"apps/{app}/frontend/src/lib/contributor/use-contributor-tasks.ts"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if old_comment in content:
            content = content.replace(old_comment, new_comment)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {path}")
        else:
            print(f"No match: {path}")

print("Done")
