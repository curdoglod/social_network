from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Post, Comment, Like, Profile

class UserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ['id', 'username']
        read_only_fields = ['id', 'username']


class UserRegistrationSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})


class PostSerializer(serializers.ModelSerializer):
    
    author = UserSerializer(read_only=True)

    image_file = serializers.FileField(required=False, allow_null=True, use_url=True)

    author_username = serializers.ReadOnlyField(source='author.username')
    author_avatar_url = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked_by_current_user = serializers.SerializerMethodField()
    author_is_superuser = serializers.ReadOnlyField(source='author.is_superuser')
    author_id = serializers.ReadOnlyField(source='author.id')

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_username', 'author_avatar_url',
            'content', 'image_file', 'timestamp',
            'comments_count', 'likes_count', 'is_liked_by_current_user',
            'author_is_superuser', 'author_id'
        ]

        read_only_fields = ['id', 'author', 'timestamp', 'author_username', 'author_avatar_url', 'comments_count', 'likes_count', 'is_liked_by_current_user', 'author_is_superuser', 'author_id']


    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked_by_current_user(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Like.objects.filter(post=obj, user=user).exists()
        return False

    def get_author_avatar_url(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.avatar:
            import os, time
            path = obj.author.profile.avatar.path
            ts = int(os.path.getmtime(path)) if os.path.exists(path) else int(time.time())
            request = self.context.get('request')
            url = f"{obj.author.profile.avatar.url}?v={ts}"
            return request.build_absolute_uri(url) if request else url
        return None


class CommentSerializer(serializers.ModelSerializer):
    
    author = UserSerializer(read_only=True)
    author_avatar_url = serializers.SerializerMethodField()

    post = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_avatar_url', 'post', 'text', 'created_at']

        read_only_fields = ['id', 'post', 'author', 'author_avatar_url', 'created_at']


    def get_author_avatar_url(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.avatar:
            import os, time
            path = obj.author.profile.avatar.path
            ts = int(os.path.getmtime(path)) if os.path.exists(path) else int(time.time())
            request = self.context.get('request')
            url = f"{obj.author.profile.avatar.url}?v={ts}"
            return request.build_absolute_uri(url) if request else url
        return None


class LikeSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        post = self.context['post']
        user = validated_data['user']
        like, _ = Like.objects.get_or_create(user=user, post=post)
        return like


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    is_superuser = serializers.ReadOnlyField(source='user.is_superuser')
    email = serializers.ReadOnlyField(source='user.email')
    
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'user', 'username', 'email', 'is_superuser', 'avatar', 'avatar_url']
        read_only_fields = ['id', 'user', 'username', 'email', 'is_superuser', 'avatar_url']

    def get_avatar_url(self, obj):
        if obj.avatar:
            import os, time
            path = obj.avatar.path
            ts = int(os.path.getmtime(path)) if os.path.exists(path) else int(time.time())
            request = self.context.get('request')
            url = f"{obj.avatar.url}?v={ts}"
            return request.build_absolute_uri(url) if request else url
        return None


