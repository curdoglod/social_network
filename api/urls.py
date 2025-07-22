from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

router.register(r'posts', views.PostViewSet, basename='post')

router.register(r'profiles', views.ProfileViewSet, basename='profile')

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),

    path('', include(router.urls)),

    path('posts/<int:post_pk>/comments/', views.CommentListCreateView.as_view(), name='post-comments-list'),
    path(
        'posts/<int:post_pk>/like/',
        views.LikeToggleView.as_view(),
        name='post-like-toggle'
    ),

    path(
        'profiles/by-username/<str:username>/',
        views.ProfileByUsernameView.as_view(),
        name='profile-by-username'
    ),
]



