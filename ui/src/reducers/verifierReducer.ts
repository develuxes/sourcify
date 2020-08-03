import {VerifierActions, VerifierState} from "../types";

export const verifierReducer = (state: VerifierState, action: VerifierActions) => {
    switch (action.type) {
        case "SET_ADDRESS":
            return {
                ...state,
                address: action.payload
            };
        case "SET_CHAIN":
            return {
                ...state,
                chain: action.payload
            }
        case "SET_FILES":
            return {
                ...state,
                files: [...state.files, ...action.payload]
            };
        case "CLEAR_FILES":
            return {
                ...state,
                files: []
            };
        case "SET_LOADING":
            return {
                ...state,
                loading: action.payload
            };
        case "SET_INCORRECT_ADDRESSES":
            return {
                ...state,
                incorrectAddresses: action.payload
            };
        case "SET_IS_VALIDATION_ERROR":
            return {
                ...state,
                isValidationError: action.payload
            };
        case "SET_VERIFY_ADDRESS_LOADING":
            return {
                ...state,
                verifyAddressLoading: action.payload
            };
        default:
            return state;
    }
}