import enum
from typing import Optional, MutableSequence, Tuple
from manim import *
import numpy as np

class Role(enum.Enum):
  ROBIN = -1
  LARK = 1


class Dancer:
  def __init__(self, role: Role, label: str, partner: Optional['Dancer'], neighbor: Optional['Dancer']):
    self.role = role
    self.label = label

    self._partner = partner
    self._neighbor = neighbor
    
    if role == Role.LARK:
      self.body = Circle(radius=0.3, color=BLUE, stroke_width=2)
      self.direction = Line(
        self.body.get_center(),
        self.body.point_from_proportion(0),
        color=BLUE,
        stroke_width=2
      )
      self.text = Text(f"L{label}", font_size=24,color=BLUE).rotate(-PI/2)
    else:
      self.body = Triangle(color=RED, stroke_width=2).scale(0.3).rotate(-PI/2)
      self.body.shift(DOWN * self.body.height/3**.5)
      self.direction = Line(
        self.body.get_center(),
        self.body.get_vertices()[0],
        color=RED,
        stroke_width=2
      )
      self.text = (Text(f"R{label}", font_size=24,color=RED)
        .rotate(-PI/2))

    self.group = VGroup(self.body, self.direction, self.text)
  
  def get_position(self):
    return self.group.get_center()
  
  def move_to(self, point):
    return self.group.move_to(point)

  @property
  def partner(self):
    return self._partner
  
  @partner.setter
  def partner(self, partner):
    if partner.role == self.role:
      raise ValueError("Partner cannot have the same role")
    self._partner = partner

  @property
  def neighbor(self):
    return self._neighbor
  
  @neighbor.setter
  def neighbor(self, neighbor):
    if neighbor.role == self.role:
      raise ValueError("Neighbor cannot have the same role")
    self._neighbor = neighbor

N_HANDS_FOURS = 5
class ContraDance(Scene):
  def construct(self):
    self.dancers = []
    for h4i in range(N_HANDS_FOURS):
      h4_center = np.array([0, 2*h4i, 0])

      l1 = Dancer(role=Role.LARK, label=f"{2*h4i+1}", partner=None, neighbor=None)
      l1.group.rotate(-PI/2)
      l1.move_to(h4_center + np.array([-1, 0.5, 0]))
      self.dancers.append(l1)

      r1 = Dancer(role=Role.ROBIN, label=f"{2*h4i+1}", partner=None, neighbor=None)
      r1.group.rotate(-PI/2)
      r1.move_to(h4_center + np.array([1, 0.5, 0]))
      self.dancers.append(r1)

      l2 = Dancer(role=Role.LARK, label=f"{2*h4i+2}", partner=None, neighbor=None)
      l2.group.rotate(PI/2)
      l2.move_to(h4_center + np.array([1, -0.5, 0]))
      self.dancers.append(l2)

      r2 = Dancer(role=Role.ROBIN, label=f"{2*h4i+2}", partner=None, neighbor=None)
      r2.group.rotate(PI/2)
      r2.move_to(h4_center + np.array([-1, -0.5, 0]))
      self.dancers.append(r2)

      l1.partner = r1
      r1.partner = l1
      l2.partner = r2
      r2.partner = l2

      l1.neighbor = r2
      r2.neighbor = l1
      l2.neighbor = r1
      r1.neighbor = l2


    self.add(*[dancer.group for dancer in self.dancers])

    # Wait a moment to show initial formation
    self.wait()
    
    # Perform neighbors swing
    self.neighbors_swing()
    
    # Wait at the end
    self.wait()

  def neighbors_swing(self):
    original_posns = {
      dancer: dancer.get_position()
      for dancer in self.dancers
    }

    self.play(*[
      dancer.group.animate.move_to(dancer.get_position() + 0.3*(dancer.neighbor.get_position()-dancer.get_position()))
      for dancer in self.dancers
    ])

    self.play(*[
      Rotate(
        dancer.group,
        angle=-4*PI,
        about_point=(dancer.get_position()+dancer.neighbor.get_position())/2,
        rate_func=linear,
        run_time=3
      )
      for dancer in self.dancers
    ])

    self.play(*[
      dancer.group.animate.move_to(original_posns[dancer])
      for dancer in self.dancers
    ])


if __name__ == "__main__":
  # Command line: manim -pql contra_dance.py ContraDance
  scene = ContraDance()
  scene.render()