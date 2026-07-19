from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class Role(models.Model):
    """Perfil/nível de acesso: Administrador, Gerente, Recepção, Profissional..."""
    nome = models.CharField(max_length=50)
    nivel = models.PositiveSmallIntegerField(help_text='Quanto maior, mais permissões (1=básico, 10=admin)')

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.nome


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    """Usuário do sistema, dentro do banco do tenant.

    Não herda PermissionsMixin (grupos/permissões do Django) de propósito:
    o controle de acesso aqui é feito pelo nosso próprio modelo Role
    (campo `nivel`), não pelo sistema de permissões nativo do Django —
    isso evita referências entre o banco do tenant e o banco central.
    """
    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=150)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='usuarios')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.nome} ({self.email})"


class MenuItem(models.Model):
    """Itens do menu lateral, liberados por nível mínimo de acesso (role.nivel)."""
    label = models.CharField(max_length=60)
    icone = models.CharField(max_length=50, help_text='nome do ícone (ex: bi-house)')
    rota = models.CharField(max_length=100)
    ordem = models.PositiveSmallIntegerField(default=0)
    nivel_minimo = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'menu_items'
        ordering = ['ordem']

    def __str__(self):
        return self.label
