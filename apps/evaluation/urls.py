from rest_framework.routers import DefaultRouter
from .views import EvaluationViewSet

router = DefaultRouter()
router.register(r'', EvaluationViewSet)

urlpatterns = router.urls