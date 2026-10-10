def texto_lembrete(cliente_nome, salao, profissional, data_txt, hora_txt, servicos):
    """Mensagem do lembrete. Deixe o texto aqui, num lugar só, para ajustar fácil."""
    prof = profissional or 'nossa equipe'
    return (
        f"Olá, {cliente_nome}! 👋\n\n"
        f"Lembrete do seu horário amanhã, {data_txt} às {hora_txt}, "
        f"no *{salao}* com *{prof}*.\n"
        f"Serviço: {servicos}.\n\n"
        "Para *CONFIRMAR* sua presença, responda *1*.\n"
        "Para *CANCELAR*, responda *2*.\n\n"
        "⚠️ Este número é uma automação e *não responde perguntas*. "
        "Para dúvidas, entre em contato diretamente com o estabelecimento."
    )


def texto_confirmado(salao):
    return f"✅ Presença confirmada no *{salao}*. Até amanhã!"


def texto_cancelado(salao):
    return (
        f"Seu agendamento no *{salao}* foi cancelado. "
        "Para remarcar, entre em contato diretamente com o estabelecimento."
    )


def texto_automatico(salao):
    return (
        "⚠️ Este número é uma automação e *não responde perguntas*.\n"
        f"Para dúvidas, entre em contato diretamente com o *{salao}*.\n"
        "Para confirmar sua presença, responda *1*. Para cancelar, responda *2*."
    )
