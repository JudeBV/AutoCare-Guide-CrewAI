"""AutoCare CrewAI Agent and Task Configuration."""

import os
from typing import List
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from tools.faq_tool import FAQSearchTool
from models import AutoCareResponse


@CrewBase
class AutoCareCrew:
    """AutoCare Customer Support & Triage Crew definition."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def classifier_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["classifier_agent"],
            verbose=False,
            memory=False,
        )

    @agent
    def faq_retrieval_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["faq_retrieval_agent"],
            tools=[FAQSearchTool()],
            verbose=False,
            memory=False,
        )

    @agent
    def response_writing_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["response_writing_agent"],
            verbose=False,
            memory=False,
        )

    @agent
    def escalation_decision_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["escalation_decision_agent"],
            verbose=False,
            memory=False,
        )

    @task
    def classification_task(self) -> Task:
        return Task(
            config=self.tasks_config["classification_task"],
            agent=self.classifier_agent(),
        )

    @task
    def faq_retrieval_task(self) -> Task:
        return Task(
            config=self.tasks_config["faq_retrieval_task"],
            agent=self.faq_retrieval_agent(),
        )

    @task
    def response_writing_task(self) -> Task:
        return Task(
            config=self.tasks_config["response_writing_task"],
            agent=self.response_writing_agent(),
        )

    @task
    def escalation_decision_task(self) -> Task:
        return Task(
            config=self.tasks_config["escalation_decision_task"],
            agent=self.escalation_decision_agent(),
            output_pydantic=AutoCareResponse,
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=False,
        )
