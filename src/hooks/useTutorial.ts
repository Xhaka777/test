import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/reducers";
import { HomeActions } from "../redux/actions";
import { TUTORIAL_STEPS } from "../config/tutorialSteps";

export const useTutorial = () => {
    const dispatch = useDispatch();
    const tutorialCompleted = useSelector((state: RootState) => state.home.tutorialCompleted);
    const currentTutorialStep = useSelector((state: RootState) => state.home.currentTutorialStep);
    const tutorialActive = useSelector((state: RootState) => state.home.tutorialActive);
    const tutorialCurrentScreen = useSelector((state: RootState) => state.home.tutorialCurrentScreen);
    const isFirstTime = useSelector((state: RootState) => state.user.isFirstTime);

    const currentStep = TUTORIAL_STEPS.find(step => step.id === currentTutorialStep);

    const startTutorial = () => {
        dispatch(HomeActions.setTutorialActive(true));
        dispatch(HomeActions.setTutorialStep(1));
        dispatch(HomeActions.setTutorialScreen('LiveStream'));
    };

    const completeTutorial = () => {
        dispatch(HomeActions.setTutorialCompleted(true));
        dispatch(HomeActions.setTutorialActive(false));
    };

    const nextStep = () => {
        if (currentTutorialStep < TUTORIAL_STEPS.length) {
            dispatch(HomeActions.setTutorialStep(currentTutorialStep + 1));
        }
    };

    const resetTutorial = () => {
        dispatch(HomeActions.resetTutorial());
    };

    const setCurrentScreen = (screen: string) => {
        dispatch(HomeActions.setTutorialScreen(screen));
    };

    const shouldShowTutorial = (screenName: string) => {
        return (
            isFirstTime &&
            !tutorialCompleted &&
            tutorialActive &&
            currentStep?.screen === screenName
        );
    };

    const shouldShowHighlight = (screenName: string, elementId: string) => {
        return (
            tutorialActive &&
            !tutorialCompleted &&
            currentStep?.screen === screenName &&
            currentStep?.highlightElement === elementId
        );
    };

    return {
        tutorialCompleted,
        currentTutorialStep,
        tutorialActive,
        tutorialCurrentScreen,
        currentStep,
        isFirstTime,
        startTutorial,
        completeTutorial,
        nextStep,
        resetTutorial,
        setCurrentScreen,
        shouldShowTutorial,
        shouldShowHighlight,
    };
};