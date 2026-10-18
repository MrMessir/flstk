def Q(prompt, correct, w1, w2, w3, explanation):
    """Вопрос: правильный ответ первым, затем три неверных. Порядок перемешивается скриптом."""
    return {
        "prompt": prompt,
        "correct": correct,
        "wrong": [w1, w2, w3],
        "explanation": explanation,
    }
