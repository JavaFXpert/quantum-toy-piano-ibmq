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

    # CE rotation (GOOD)
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

    # CF rotation (GOOD)
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

    # DE rotation (GOOD)
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

    # DF rotation (GOOD)
    qc.h(q[0])
    qc.h(q[1])
    qc.cx(q[1], q[0])
    qc.u3(a[4], 0, 0, q[1])
    qc.cx(q[1], q[0])
    qc.h(q[0])
    qc.h(q[1])
    qc.u3(a[4], 0, 0, q[1])

    # EF rotation (GOOD)
    qc.cx(q[1], q[0])
    qc.u3(-a[5], 0, 0, q[0])
    qc.cx(q[1], q[0])
    qc.u3(a[5], 0, 0, q[0])

    qc.measure(q, c)

    return qc

