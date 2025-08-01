from rest_framework import permissions

class IsOwnerOrReadOnlyPost(permissions.BasePermission):
    

    def has_object_permission(self, request, view, obj):
        
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.author == request.user or request.user.is_superuser

class IsOwnerOrReadOnlyComment(permissions.BasePermission):
    

    def has_object_permission(self, request, view, obj):
        
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.author == request.user or request.user.is_superuser



class IsSelf(permissions.BasePermission):
    

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        owner = getattr(obj, 'user', obj)
        return owner == request.user
