import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json"
    },
    timeout:10000,
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

    (error) => {
        if(error.response && error.response.status === 401) {
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
