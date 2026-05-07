from rest_framework.routers import DefaultRouter
from .views import WeeklyLogView

router = DefaultRouter()
router.register(r'weeklylogs', WeeklyLogView, basename='weeklylogs')

urlpatterns = router.urls

