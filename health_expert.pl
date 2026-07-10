:- initialization(main, now).

main :- true.

split_symptoms('none', []) :- !.
split_symptoms(SymptomString, Symptoms) :-
    split_string(SymptomString, ",", " ", Parts),
    maplist(atom_string, Symptoms, Parts).

has_symptom(Symptom, Symptoms) :-
    member(Symptom, Symptoms).

diagnosis(Symptoms, _, Temperature, _, _, _, viral_infection) :-
    has_symptom(fever, Symptoms),
    has_symptom(cough, Symptoms),
    has_symptom(fatigue, Symptoms),
    Temperature >= 37.5.

diagnosis(Symptoms, _, _, Oxygen, _, _, cardiac_alert) :-
    has_symptom(chest_pain, Symptoms),
    (has_symptom(shortness_of_breath, Symptoms); Oxygen < 93).

diagnosis(Symptoms, _, _, _, high, _, stress_overload) :-
    has_symptom(headache, Symptoms).

diagnosis(Symptoms, _, _, _, _, _, diabetes_risk) :-
    has_symptom(thirst, Symptoms),
    has_symptom(frequent_urination, Symptoms).

diagnosis(_, _, _, _, _, _, general_wellness).

observation(viral_infection, 'Symptom pattern matches a likely viral infection profile.').
observation(cardiac_alert, 'Chest pain with breathing difficulty indicates a possible cardiac emergency.').
observation(stress_overload, 'Headache combined with high stress suggests stress overload.').
observation(diabetes_risk, 'Frequent urination with thirst suggests diabetic-risk screening is needed.').
observation(general_wellness, 'No strong disease rule was triggered from the current information.').

recommendation(viral_infection, 'Rest well, stay hydrated, and arrange a physician review if symptoms persist.').
recommendation(cardiac_alert, 'Seek urgent doctor attention immediately.').
recommendation(stress_overload, 'Reduce workload, improve sleep, and practice guided relaxation.').
recommendation(diabetes_risk, 'Schedule blood sugar testing and clinical review.').
recommendation(general_wellness, 'Maintain balanced diet, exercise, hydration, and regular check-ups.').

precaution(viral_infection, 'Avoid dehydration, crowded exposure, and heavy physical exertion until recovery.').
precaution(cardiac_alert, 'Avoid self-driving, strenuous activity, and delaying emergency evaluation.').
precaution(stress_overload, 'Avoid overwork, sleep loss, and excessive caffeine until symptoms settle.').
precaution(diabetes_risk, 'Avoid excess sugar intake, skipped meals, and ignoring repeat symptoms.').
precaution(general_wellness, 'Avoid irregular sleep, poor hydration, and a prolonged sedentary routine.').

doctor_specialization(viral_infection, 'General physician').
doctor_specialization(viral_infection, 'Pulmonologist').
doctor_specialization(cardiac_alert, 'Cardiologist').
doctor_specialization(cardiac_alert, 'Emergency medicine specialist').
doctor_specialization(stress_overload, 'Neurologist').
doctor_specialization(stress_overload, 'Mental health counselor').
doctor_specialization(diabetes_risk, 'Endocrinologist').
doctor_specialization(diabetes_risk, 'Diabetologist').
doctor_specialization(general_wellness, 'General physician').

food_item(viral_infection, 'Warm fluids').
food_item(viral_infection, 'Citrus fruits').
food_item(viral_infection, 'Light soups').
food_item(viral_infection, 'Soft cooked vegetables').
food_item(cardiac_alert, 'Low-salt meals').
food_item(cardiac_alert, 'Oats').
food_item(cardiac_alert, 'Boiled vegetables').
food_item(cardiac_alert, 'Plenty of water unless medically restricted').
food_item(stress_overload, 'Hydrating fluids').
food_item(stress_overload, 'Bananas').
food_item(stress_overload, 'Nuts in moderation').
food_item(stress_overload, 'Magnesium-rich foods').
food_item(diabetes_risk, 'High-fiber foods').
food_item(diabetes_risk, 'Whole grains').
food_item(diabetes_risk, 'Leafy vegetables').
food_item(diabetes_risk, 'Controlled-portion meals').
food_item(general_wellness, 'Seasonal fruits').
food_item(general_wellness, 'Vegetables').
food_item(general_wellness, 'Protein-rich meals').
food_item(general_wellness, 'Adequate water intake').

food_to_avoid(viral_infection, 'Deep-fried foods').
food_to_avoid(viral_infection, 'Ice-cold drinks').
food_to_avoid(viral_infection, 'Processed snacks').
food_to_avoid(cardiac_alert, 'High-salt packaged food').
food_to_avoid(cardiac_alert, 'Deep-fried food').
food_to_avoid(cardiac_alert, 'Sugary beverages').
food_to_avoid(stress_overload, 'Excess coffee').
food_to_avoid(stress_overload, 'Energy drinks').
food_to_avoid(stress_overload, 'Late-night junk food').
food_to_avoid(diabetes_risk, 'Sugary sweets').
food_to_avoid(diabetes_risk, 'Refined flour items').
food_to_avoid(diabetes_risk, 'Sweetened soft drinks').
food_to_avoid(general_wellness, 'Highly processed food').
food_to_avoid(general_wellness, 'Sugary packaged snacks').
food_to_avoid(general_wellness, 'Excess oily meals').

exercise_item(viral_infection, 'Complete rest during fever').
exercise_item(viral_infection, 'Resume with short walks after recovery').
exercise_item(cardiac_alert, 'Avoid exercise until cleared by a doctor').
exercise_item(cardiac_alert, 'Focus on supervised breathing control and recovery').
exercise_item(stress_overload, 'Gentle stretching').
exercise_item(stress_overload, 'Breathing exercises for 10 to 15 minutes').
exercise_item(stress_overload, 'Light yoga or walking').
exercise_item(diabetes_risk, 'Brisk walking for 30 minutes').
exercise_item(diabetes_risk, 'Light strength training 3 times a week').
exercise_item(general_wellness, '30 minutes of walking').
exercise_item(general_wellness, 'Light stretching').
exercise_item(general_wellness, 'Basic body-weight exercise 3 to 4 times weekly').

diet_item(viral_infection, 'Soft, warm, easy-to-digest meals').
diet_item(viral_infection, 'Frequent fluids and vitamin-rich foods').
diet_item(cardiac_alert, 'Low-sodium heart-friendly meals').
diet_item(cardiac_alert, 'Small balanced meals with whole grains and vegetables').
diet_item(stress_overload, 'Regular meals without skipping').
diet_item(stress_overload, 'Hydration-focused diet with magnesium-rich foods').
diet_item(diabetes_risk, 'Low-sugar diabetic-friendly meal plan').
diet_item(diabetes_risk, 'High-fiber foods with portion control').
diet_item(general_wellness, 'Balanced diet with protein, vegetables, fruits, and whole grains').

extra_recommendation(low, 'Add light daily movement and walking to improve wellness.').
extra_recommendation(high, 'High stress detected. Include mindfulness and sleep recovery in the care plan.').

urgency(cardiac_alert, critical).
urgency(viral_infection, medium).
urgency(stress_overload, medium).
urgency(diabetes_risk, medium).
urgency(general_wellness, low).

risk(cardiac_alert, 84).
risk(viral_infection, 54).
risk(stress_overload, 42).
risk(diabetes_risk, 63).
risk(general_wellness, 22).

health_assessment(Name, Age, HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, SymptomString, Result) :-
    split_symptoms(SymptomString, Symptoms),
    diagnosis(Symptoms, HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, Diagnosis),
    observation(Diagnosis, Observation),
    recommendation(Diagnosis, Recommendation),
    precaution(Diagnosis, Precaution),
    findall(Specialist, doctor_specialization(Diagnosis, Specialist), DoctorSpecialization),
    findall(Food, food_item(Diagnosis, Food), FoodIntake),
    findall(AvoidFood, food_to_avoid(Diagnosis, AvoidFood), FoodsToAvoid),
    findall(Exercise, exercise_item(Diagnosis, Exercise), ExercisePlan),
    findall(Diet, diet_item(Diagnosis, Diet), DietPlan),
    urgency(Diagnosis, BaseUrgency),
    risk(Diagnosis, BaseRisk),
    supplemental_observations(HeartRate, Temperature, Oxygen, AdditionalObservations),
    supplemental_recommendations(HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, ExtraRecommendations),
    supplemental_precautions(HeartRate, Temperature, Oxygen, PrecautionNotes),
    append([Observation], AdditionalObservations, Observations),
    append([Recommendation], ExtraRecommendations, RecommendationList),
    append([Precaution], PrecautionNotes, PrecautionList),
    adjust_urgency(BaseUrgency, Oxygen, Temperature, HeartRate, FinalUrgency),
    adjust_risk(BaseRisk, Oxygen, Temperature, HeartRate, FinalRisk),
    Result = result{
        patient: Name,
        age: Age,
        diagnosis: Diagnosis,
        matchedRules: [Diagnosis],
        observations: Observations,
        recommendations: RecommendationList,
        precautions: PrecautionList,
        doctorSpecialization: DoctorSpecialization,
        foodIntake: FoodIntake,
        foodsToAvoid: FoodsToAvoid,
        exercisePlan: ExercisePlan,
        dietPlan: DietPlan,
        urgency: FinalUrgency,
        riskScore: FinalRisk
    }.

supplemental_observations(HeartRate, Temperature, Oxygen, Observations) :-
    findall(Observation, additional_observation(HeartRate, Temperature, Oxygen, Observation), Observations).

additional_observation(HeartRate, _, _, 'Heart rate is elevated and should be monitored.') :-
    HeartRate > 110.
additional_observation(_, Temperature, _, 'Temperature is elevated above the healthy threshold.') :-
    Temperature >= 38.5.
additional_observation(_, _, Oxygen, 'Oxygen saturation is low and needs urgent review.') :-
    Oxygen > 0,
    Oxygen < 92.

supplemental_recommendations(HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, Recommendations) :-
    findall(Recommendation, additional_recommendation(HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, Recommendation), Recommendations).

additional_recommendation(_, _, _, _, low, Recommendation) :-
    extra_recommendation(low, Recommendation).
additional_recommendation(_, _, _, high, _, Recommendation) :-
    extra_recommendation(high, Recommendation).
additional_recommendation(_, Temperature, _, _, _, 'Monitor fever closely and continue hydration.') :-
    Temperature >= 38.5.
additional_recommendation(_, _, Oxygen, _, _, 'Use emergency care channels if oxygen remains low.') :-
    Oxygen > 0,
    Oxygen < 92.
additional_recommendation(HeartRate, _, _, _, _, 'Rest and repeat the measurement after a short interval.') :-
    HeartRate > 110.

supplemental_precautions(HeartRate, Temperature, Oxygen, Precautions) :-
    findall(Precaution, additional_precaution(HeartRate, Temperature, Oxygen, Precaution), Precautions).

additional_precaution(_, Temperature, _, 'Avoid cold drinks, alcohol, and poor hydration while fever is elevated.') :-
    Temperature >= 38.5.
additional_precaution(_, _, Oxygen, 'Avoid exertion and monitor oxygen readings closely when saturation is low.') :-
    Oxygen > 0,
    Oxygen < 92.
additional_precaution(HeartRate, _, _, 'Avoid intense exercise until heart rate returns closer to normal.') :-
    HeartRate > 110.

adjust_urgency(_, Oxygen, _, _, critical) :-
    Oxygen > 0,
    Oxygen < 92,
    !.
adjust_urgency(_, _, Temperature, _, critical) :-
    Temperature >= 40,
    !.
adjust_urgency(low, _, _, HeartRate, medium) :-
    HeartRate > 110,
    !.
adjust_urgency(BaseUrgency, _, _, _, BaseUrgency).

adjust_risk(BaseRisk, Oxygen, Temperature, HeartRate, FinalRisk) :-
    (HeartRate > 110 -> AddHeart = 8 ; AddHeart = 0),
    (Temperature >= 38.5 -> AddTemp = 10 ; AddTemp = 0),
    ((Oxygen > 0, Oxygen < 92) -> AddOxygen = 20 ; AddOxygen = 0),
    Risk1 is BaseRisk + AddHeart + AddTemp + AddOxygen,
    FinalRisk is min(Risk1, 96).

json_list([], '[]').
json_list(List, Json) :-
    maplist(json_quote, List, Quoted),
    atomic_list_concat(Quoted, ',', Inner),
    format(atom(Json), '[~w]', [Inner]).

json_quote(Value, Json) :-
    format(atom(Json), '"~w"', [Value]).

health_assessment_json(Name, Age, HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, SymptomString, Json) :-
    health_assessment(Name, Age, HeartRate, Temperature, Oxygen, StressLevel, ActivityLevel, SymptomString, Result),
    Diagnosis = Result.diagnosis,
    Urgency = Result.urgency,
    RiskScore = Result.riskScore,
    Observations = Result.observations,
    Recommendations = Result.recommendations,
    Precautions = Result.precautions,
    DoctorSpecialization = Result.doctorSpecialization,
    FoodIntake = Result.foodIntake,
    FoodsToAvoid = Result.foodsToAvoid,
    ExercisePlan = Result.exercisePlan,
    DietPlan = Result.dietPlan,
    MatchedRules = Result.matchedRules,
    json_list(Observations, ObservationJson),
    json_list(Recommendations, RecommendationJson),
    json_list(Precautions, PrecautionJson),
    json_list(DoctorSpecialization, DoctorJson),
    json_list(FoodIntake, FoodJson),
    json_list(FoodsToAvoid, AvoidJson),
    json_list(ExercisePlan, ExerciseJson),
    json_list(DietPlan, DietJson),
    json_list(MatchedRules, RulesJson),
    format(
        atom(Json),
        '{"diagnosis":"~w","matchedRules":~w,"observations":~w,"recommendations":~w,"precautions":~w,"doctorSpecialization":~w,"foodIntake":~w,"foodsToAvoid":~w,"exercisePlan":~w,"dietPlan":~w,"urgency":"~w","riskScore":~w,"engine":"prolog","engineMessage":"Assessment generated by SWI-Prolog expert rules."}',
        [Diagnosis, RulesJson, ObservationJson, RecommendationJson, PrecautionJson, DoctorJson, FoodJson, AvoidJson, ExerciseJson, DietJson, Urgency, RiskScore]
    ).
