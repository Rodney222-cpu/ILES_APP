import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json"
    },
    timeout:30000,
});

export const setAuthToken = (access, refresh, role, username) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
}


export const getAuthToken = () => {
    return localStorage.getItem("access");
}

export const getRefreshToken = () => {
    return localStorage.getItem("refresh");
}

export const getUserRole = () => {
    return localStorage.getItem("role");
}

export const removeAuthToken = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
}

api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();

        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already retried, try to refresh the token
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000") + "/users/refresh/",
                        { refresh: refreshToken }
                    );
                    const newAccessToken = response.data.access;
                    localStorage.setItem("access", newAccessToken);

                    // If refresh rotation is on, save the new refresh token
                    if (response.data.refresh) {
                        localStorage.setItem("refresh", response.data.refresh);
                    }

                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - token is truly expired, log out
                    removeAuthToken();
                    window.location.href = "/login";
                    return Promise.reject(refreshError);
                }
            }

            // No refresh token available
            removeAuthToken();
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export const registerUser = (data) => {
    return api.post("/users/register/", data);
};

export const loginUser = (data) => {
    return api.post("/users/login/", data);
};

export const logoutUser = () => {
    removeAuthToken();
    window.location.href = "/login";
};

export const getWeeklyLogs = (status) => {
    const params = status && status !== "ALL" ? { status } : {};
    return api.get("/weeklylogs/weeklylogs/", { params });
};

export const createWeeklyLog = (data) => {
    return api.post("/weeklylogs/weeklylogs/", data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const reviewWeeklyLog = (id, payload) => {
    return api.post(`/weeklylogs/weeklylogs/${id}/decision/`, payload);
};

export const authorizeWeeklyLog = (id, payload) => {
    return api.post(`/weeklylogs/weeklylogs/${id}/authorize/`, payload);
};

export const submitLogToAcademic = (id) => {
    return api.post(`/weeklylogs/weeklylogs/${id}/submit_to_academic/`);
};

export const evaluateWeeklyLog = (id, payload) => {
    return api.post(`/weeklylogs/weeklylogs/${id}/evaluate/`, payload);
};

export default api;


// Placement APIs
export const getPlacement = () => {
    return api.get("/placements/");
};

export const createPlacement = (data) => {
    return api.post("/placements/", data);
};

export const updatePlacement = (id, data) => {
    return api.patch(`/placements/${id}/`, data);
};

export const getPendingPlacements = () => {
    return api.get("/placements/pending/");
};

export const approvePlacement = (id, data) => {
    return api.post(`/placements/${id}/approve/`, data);
};

export const rejectPlacement = (id, data) => {
    return api.post(`/placements/${id}/reject/`, data);
};

export const assignSupervisor = (id, data) => {
    return api.post(`/placements/${id}/assign_supervisor/`, data);
};

export const getSupervisors = () => {
    return api.get("/placements/supervisors/");
};

export const getWorkplaceSupervisors = () => {
    return api.get("/placements/workplace_supervisors/");
};

export const assignWorkplaceSupervisor = (id, data) => {
    return api.post(`/placements/${id}/assign_workplace_supervisor/`, data);
};

export const getActivePlacements = () => {
    return api.get("/placements/active/");
};

export const getCompletedPlacements = () => {
    return api.get("/placements/completed/");
};

export const getPlacementStats = () => {
    return api.get("/placements/stats/");
};

export const markPlacementCompleted = (id) => {
    return api.post(`/placements/${id}/mark_completed/`);
};

// Evaluation APIs
export const getEvaluations = () => {
    return api.get("/evaluations/evaluations/");
};

export const createEvaluation = (data) => {
    return api.post("/evaluations/evaluations/", data);
};

export const updateEvaluation = (id, data) => {
    return api.put(`/evaluations/evaluations/${id}/`, data);
};

// Notification APIs
export const getNotifications = () => {
    return api.get("/notifications/notifications/");
};

export const markNotificationAsRead = (id) => {
    return api.post(`/notifications/notifications/${id}/mark_as_read/`);
};

export const markAllNotificationsAsRead = () => {
    return api.post("/notifications/notifications/mark_all_as_read/");
};

export const getUnreadNotificationCount = () => {
    return api.get("/notifications/notifications/unread_count/");
};
