from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)
    id = serializers.CharField(help_text='CPF ou CNPJ do assinante')
