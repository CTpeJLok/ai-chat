from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("organization", views.OrganizationViewSet)
router.register("document", views.DocumentViewSet)
router.register("chat", views.ChatViewSet)

urlpatterns = router.urls
