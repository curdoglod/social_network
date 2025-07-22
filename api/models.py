from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Post(models.Model):
    
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
    )
    content = models.TextField(
        blank=True,
        null=True,
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )
    image_file = models.FileField(
        upload_to='post_files/',
        null=True,
        blank=True,
    )

    class Meta:
        
        ordering = ['-timestamp']
        verbose_name = "Post"
        verbose_name_plural = "Posts"

    def __str__(self):
        
        return f"Post by {self.author.username} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class Comment(models.Model):
    
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="Parent post"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='comments_by_author',
        help_text="Comment author"
    )
    text = models.TextField(
        help_text="Comment text"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Created at"
    )

    class Meta:
        
        ordering = ['created_at']
        verbose_name = "Comment"
        verbose_name_plural = "Comments"

    def __str__(self):
        
        text_snippet = self.text[:50] + "..." if len(self.text) > 50 else self.text
        return f"Comment by {self.author.username} on Post {self.post.id} at {self.created_at.strftime('%Y-%m-%d %H:%M')}: '{text_snippet}'"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='likes', null=True, blank=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} likes {self.post.id}'


class Profile(models.Model):
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()



