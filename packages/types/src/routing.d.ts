export interface RoutingQuestion {
    id: string;
    label: string;
    type: 'text' | 'select' | 'radio';
    options?: string[];
    required: boolean;
}
export interface RoutingRule {
    id: string;
    fieldId: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
    action: 'route_to_event_type' | 'route_to_user' | 'custom_url';
    targetId: string;
}
export interface RoutingForm {
    id: string;
    userId: string;
    teamId?: string;
    title: string;
    description?: string;
    isPublished: boolean;
    questions: RoutingQuestion[];
    rules: RoutingRule[];
    fallbackEventTypeId?: string;
}
export interface RoutingSubmission {
    formId: string;
    answers: Record<string, string>;
    resolvedRoute: {
        action: string;
        targetId: string;
        targetUrl: string;
    };
}
