#
# Copyright 2018 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister
from qiskit import available_backends, execute

from math import *
import numpy as np

def compute_circuit(angles_vector_in_degrees_str, q, c, qc):
    rotation_deg_of_freedom = 6
    a = [0] * rotation_deg_of_freedom
    for i in range(rotation_deg_of_freedom):
        a[i] = radians(float(angles_vector_in_degrees_str[i]))

    # Passed in from calling program
    # q = QuantumRegister(3)
    # qc = QuantumCircuit(q, c)

    # CD rotation
    qc.x(q[1])
    qc.cx(q[1], q[0])
    qc.u3(-a[0], 0, 0, q[0])
    qc.cx(q[1], q[0])
    qc.u3(a[0], 0, 0, q[0])
    qc.x(q[1])

    # CE rotation
    qc.x(q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.u3(a[1], 0, 0, q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.u3(a[1], 0, 0, q[1])
    qc.x(q[0])

    # CF rotation
    qc.x(q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.x(q[0])
    qc.cx(q[1], q[0])
    qc.u3(-a[2], 0, 0, q[0])
    qc.cx(q[1], q[0])
    qc.u3(a[2], 0, 0, q[0])
    qc.x(q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.x(q[0])

    # DE rotation
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.u3(a[3], 0, 0, q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.u3(a[3], 0, 0, q[1])
    qc.cx(q[1], q[0])

    # DF rotation
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.u3(a[4], 0, 0, q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.u3(a[4], 0, 0, q[1])

    # EF rotation
    qc.cx(q[1], q[0])
    qc.u3(-a[5], 0, 0, q[0])
    qc.cx(q[1], q[0])
    qc.u3(a[5], 0, 0, q[0])

    qc.measure(q, c)

    return qc

