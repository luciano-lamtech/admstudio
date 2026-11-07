FUSO_PADRAO = 'America/Sao_Paulo'

# Fusos do Brasil (o país não usa horário de verão atualmente).
FUSOS_BRASIL = [
    ('America/Sao_Paulo', 'Brasília (UTC-3) – SP, RJ, MG, ES, PR, SC, RS, GO, DF'),
    ('America/Bahia', 'Bahia (UTC-3)'),
    ('America/Fortaleza', 'Fortaleza (UTC-3) – CE, RN, PB, PI, MA'),
    ('America/Recife', 'Recife (UTC-3) – PE'),
    ('America/Maceio', 'Maceió (UTC-3) – AL, SE'),
    ('America/Belem', 'Belém (UTC-3) – PA, AP'),
    ('America/Araguaina', 'Araguaína (UTC-3) – TO'),
    ('America/Cuiaba', 'Cuiabá (UTC-4) – MT'),
    ('America/Campo_Grande', 'Campo Grande (UTC-4) – MS'),
    ('America/Manaus', 'Manaus (UTC-4) – AM'),
    ('America/Porto_Velho', 'Porto Velho (UTC-4) – RO'),
    ('America/Boa_Vista', 'Boa Vista (UTC-4) – RR'),
    ('America/Rio_Branco', 'Rio Branco (UTC-5) – AC'),
    ('America/Noronha', 'Fernando de Noronha (UTC-2)'),
]
FUSOS_VALIDOS = {valor for valor, _ in FUSOS_BRASIL}
