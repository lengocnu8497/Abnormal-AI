from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, SummaryViewSet

router = DefaultRouter()
router.register(r'files', FileViewSet)

summary_router = DefaultRouter()
summary_router.register(r'summaries', SummaryViewSet, basename='summaries')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(summary_router.urls)),
]