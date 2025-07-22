from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import status, generics, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .serializers import UserRegistrationSerializer, LoginSerializer, PostSerializer, CommentSerializer, ProfileSerializer
from .models import Post, Comment, Like, Profile
from .permissions import IsOwnerOrReadOnlyPost, IsOwnerOrReadOnlyComment, IsSelf


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request._request, user)
            avatar_url = None
            if hasattr(user, 'profile') and user.profile.avatar:
                avatar_url = request.build_absolute_uri(user.profile.avatar.url)
            return Response(
                {
                    "message": "User registered and logged in successfully",
                    "user_id": user.id,
                    "username": user.username,
                    "is_superuser": user.is_superuser,
                    "avatar_url": avatar_url
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            user = authenticate(request._request, username=username, password=password)

            if user is not None:
                login(request._request, user)
                token, created = Token.objects.get_or_create(user=user)
                avatar_url = None
                if hasattr(user, 'profile') and user.profile.avatar:
                    avatar_url = request.build_absolute_uri(user.profile.avatar.url)
                return Response(
                    {
                        "message": "Login successful",
                        "user_id": user.id,
                        "username": user.username,
                        "is_superuser": user.is_superuser,
                        "avatar_url": avatar_url,
                        "token": token.key
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": "Invalid username or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        
        logout(request._request)
        return Response(
            {"message": "Logged out successfully"},
            status=status.HTTP_200_OK
        )

class PostViewSet(viewsets.ModelViewSet):
    
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['author', 'author__username']
    ordering_fields = ['timestamp', 'author__username']
    search_fields = ['content', 'author__username']


    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnlyPost]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class CommentListCreateView(generics.ListCreateAPIView):
    
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        
        post_pk = self.kwargs['post_pk']
        post = get_object_or_404(Post, pk=post_pk)
        return Comment.objects.filter(post=post)

    def perform_create(self, serializer):
        
        post_pk = self.kwargs['post_pk']
        post_instance = get_object_or_404(Post, pk=post_pk)
        if self.request.user.is_authenticated:
            serializer.save(post=post_instance, author=self.request.user)
        else:
            serializer.save(post=post_instance)


class CommentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnlyComment]

    def get_queryset(self):
        
        post_pk = self.kwargs['post_pk']
        post = get_object_or_404(Post, pk=post_pk)
        return Comment.objects.filter(post=post)


class LikeToggleView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, post_pk=None):
        post = get_object_or_404(Post, pk=post_pk)
        user = request.user if request.user.is_authenticated else None

        try:
            if user:
                like = Like.objects.get(user=user, post=post)
                like.delete()
                return Response({"detail": "Post unliked successfully.", "liked": False}, status=status.HTTP_200_OK)
            else:
                try:
                    anonymous_like = Like.objects.get(user=None, post=post)
                    anonymous_like.delete()
                    return Response({"detail": "Anonymous like removed.", "liked": False}, status=status.HTTP_200_OK)
                except Like.DoesNotExist:
                    pass
            Like.objects.create(user=user, post=post)
            return Response({"detail": "Post liked successfully.", "liked": True}, status=status.HTTP_201_CREATED)

        except Like.DoesNotExist:
            Like.objects.create(user=user, post=post)
            return Response({"detail": "Post liked successfully.", "liked": True}, status=status.HTTP_201_CREATED)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        elif self.action in ['update', 'partial_update', 'me']:
            permission_classes = [IsAuthenticated, IsSelf]
        else:
            permission_classes = [IsAuthenticated]
        return [p() for p in permission_classes]

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ProfileByUsernameView(generics.RetrieveAPIView):
    """Retrieve a profile by the related user's username so that the frontend can access
    a user profile via `/api/profiles/by-username/<username>/`."""

    queryset = Profile.objects.select_related('user')
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]

    lookup_field = 'username'

    def get_object(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        return get_object_or_404(Profile, user=user)
