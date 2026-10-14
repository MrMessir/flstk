def H(text):
    return {"type": "heading", "content": text}


def P(text):
    return {"type": "paragraph", "content": text}


def L(items, ordered=False):
    block = {"type": "list", "items": items}
    if ordered:
        block["ordered"] = True
    return block
