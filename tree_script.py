import os

def print_tree(startpath, exclude_dirs, out_file):
    with open(out_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(startpath):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write(f'{indent}{os.path.basename(root)}/\n')
            subindent = ' ' * 4 * (level + 1)
            for file in files:
                f.write(f'{subindent}{file}\n')

exclude = {'.git', 'venv', 'node_modules', '__pycache__', '.pytest_cache'}
print_tree('.', exclude, 'clean_tree_utf8.txt')
