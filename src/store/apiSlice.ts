import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Project', 'Lead', 'Invoice', 'Inventory', 'Production', 'Dispatch', 'Attendance', 'Drawing', 'Category', 'Unit'],
  endpoints: (builder) => ({
    getLeads: builder.query<any[], void>({
      query: () => '/leads',
      providesTags: ['Lead'],
    }),
    createLead: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/leads',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lead'],
    }),
    getProjects: builder.query<any[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    getInvoices: builder.query<any[], void>({
      query: () => '/invoices',
      providesTags: ['Invoice']
    }),
    createInvoice: builder.mutation<any, Partial<any>>({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Invoice']
    }),
    getDrawings: builder.query<any[], string>({
      query: (projectId) => `/drawings/${projectId}`,
      providesTags: (_result, _error, id) => [{ type: 'Drawing', id }],
    }),
    addDrawing: builder.mutation<any, Partial<any>>({
      query: (body) => ({ url: '/drawings', method: 'POST', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Drawing', id: projectId }],
    }),
    approveDrawing: builder.mutation<any, { id: string, body: Partial<any> }>({
      query: ({ id, body }) => ({ url: `/drawings/${id}/approve`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { body }) => [{ type: 'Drawing', id: body.projectId }],
    }),
    uploadFiles: builder.mutation<{ success: boolean; urls: string[] }, FormData>({
      query: (body) => ({
        url: '/upload',
        method: 'POST',
        body,
      }),
    }),
    getInventory: builder.query<any[], void>({
      query: () => '/inventory',
      providesTags: ['Inventory']
    }),
    createInventory: builder.mutation<any, Partial<any>>({
      query: (body) => ({ url: '/inventory', method: 'POST', body }),
      invalidatesTags: ['Inventory']
    }),
    getProductionLogs: builder.query<any[], void>({
      query: () => '/production',
      providesTags: ['Production']
    }),
    login: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body })
    }),
    registerUser: builder.mutation<any, any>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body })
    }),
    getMachines: builder.query<any[], void>({
      query: () => '/machines',
      providesTags: ['Inventory'] // Reusing for simplicity or can create Machine tag
    }),
    getLiveFeed: builder.query<any[], void>({
      query: () => '/live-feed',
      providesTags: ['Attendance', 'Production']
    }),
    punchIn: builder.mutation<any, any>({
      query: (body) => ({ url: '/hr/attendance/checkin', method: 'POST', body }),
      invalidatesTags: ['Attendance']
    }),
    punchOut: builder.mutation<any, void>({
      query: () => ({ url: '/hr/attendance/checkout', method: 'POST' }),
      invalidatesTags: ['Attendance']
    }),
    getActiveSession: builder.query<any, void>({
      query: () => '/hr/attendance/active',
      providesTags: ['Attendance']
    }),
    getStaffSalary: builder.query<any[], void>({
      query: () => '/hr/staff-salary',
      providesTags: ['Attendance'],
    }),

    getCategories: builder.query<any[], void>({
      query: () => '/categories',
      providesTags: ['Category']
    }),
    createCategory: builder.mutation<any, { name: string }>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category']
    }),
    deleteCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Category']
    }),

    getUnits: builder.query<any[], void>({
      query: () => '/units',
      providesTags: ['Unit']
    }),
    createUnit: builder.mutation<any, { name: string }>({
      query: (body) => ({
        url: '/units',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Unit']
    }),
    deleteUnit: builder.mutation<any, string>({
      query: (id) => ({
        url: `/units/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Unit']
    }),

    addMachine: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/machines',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Production'],
    }),
    deleteMachine: builder.mutation<any, string>({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Production'],
    }),
    updateProductionLog: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/production/${id}/complete`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Production'],
    }),
    createProductionLog: builder.mutation<any, Partial<any>>({
      query: (body) => ({ url: '/production', method: 'POST', body }),
      invalidatesTags: ['Production']
    }),
    getProjectProductionLogs: builder.query<any[], string>({
      query: (projectId) => `/production/project/${projectId}`,
      providesTags: ['Production']
    }),
    getDispatches: builder.query<any[], void>({
      query: () => '/dispatch',
      providesTags: ['Dispatch']
    }),
    createDispatch: builder.mutation<any, Partial<any>>({
      query: (body) => ({ url: '/dispatch', method: 'POST', body }),
      invalidatesTags: ['Dispatch']
    }),
    getAttendance: builder.query<any[], void>({
      query: () => '/hr/attendance',
      providesTags: ['Attendance']
    }),
    getDashboardSummary: builder.query<any, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Project', 'Lead', 'Invoice'] // Invalidate/refetch when these change
    }),
    getProjectById: builder.query<any, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project']
    }),
    updateProject: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Project']
    }),
    deleteProject: builder.mutation<any, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project']
    }),
    getProjectMaterials: builder.query<any[], string>({
      query: (projectId) => `/projects/${projectId}/materials`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id: `${id}_MATERIALS` }]
    }),
    reserveProjectMaterial: builder.mutation<any, { projectId: string; data: any }>({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/materials`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: `${projectId}_MATERIALS` },
        'Inventory'
      ]
    }),
    createQuotation: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/quotations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project']
    })
  }),
});

export const {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetDrawingsQuery,
  useAddDrawingMutation,
  useApproveDrawingMutation,
  useUploadFilesMutation,
  useGetInventoryQuery,
  useCreateInventoryMutation,
  useGetProductionLogsQuery,
  useCreateProductionLogMutation,
  useUpdateProductionLogMutation,
  useLoginMutation,
  useRegisterUserMutation,
  useGetMachinesQuery,
  useAddMachineMutation,
  useDeleteMachineMutation,
  useGetLiveFeedQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetActiveSessionQuery,
  useGetDispatchesQuery,
  useCreateDispatchMutation,
  useGetAttendanceQuery,
  useGetStaffSalaryQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useGetDashboardSummaryQuery,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useGetProjectMaterialsQuery,
  useReserveProjectMaterialMutation,
  useCreateQuotationMutation,
  useGetProjectProductionLogsQuery,
  useDeleteProjectMutation
} = apiSlice;
