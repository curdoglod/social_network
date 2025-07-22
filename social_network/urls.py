from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    path('', TemplateView.as_view(template_name='index.html'), name='frontend_index'),

    # Catch-all for client-side routes
    re_path(r'^(?!api/|admin/|media/).*$', TemplateView.as_view(template_name='index.html'), name='spa_fallback'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)




